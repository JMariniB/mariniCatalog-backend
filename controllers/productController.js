const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;
const axios = require("axios");
const cheerio = require("cheerio");

// Create Prouct
const createProduct = asyncHandler(async (req, res) => {
  const { name, amzorderid, amzorderdate, asin, location, quantity, price, description, isPublished, pendingPublish } = req.body;

  //   Validation
  if (!name || !amzorderid || !amzorderdate || !asin) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  // Handle Image upload
  let fileData = {};
  if (req.file) {
    // Save image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "MariniCatalog",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  //Check if order Id already exists
    const productExists = await Product.findOne({amzorderid});

    if(productExists){
        res.status(400);
        throw new Error("Amazon Order ID already registered.");
    }

  // Create Product
  const product = await Product.create({
    name,
    amzorderid,
    amzorderdate,
    asin,
    location,
    quantity,
    price,
    description,
    isPublished,
    pendingPublish,
    image: fileData,
  });

  res.status(201).json(product);
});

const createMultipleProducts = async (req, res) => {
  try {
    const productsData = req.body; // Arreglo de objetos con datos de productos

    // Validación
    if (!Array.isArray(productsData) || productsData.length === 0) {
      res.status(400);
      throw new Error('Please provide an array of products');
    }

    const createdProducts = [];

    // Iterar sobre los datos de productos y crear cada uno
    for (const productData of productsData) {
      const {
        name,
        amzorderid,
        amzorderdate,
        asin,
        location,
        quantity,
        price,
        description,
        isPublished,
        pendingPublish,
      } = productData;

      // Validación para cada producto
      if (!name || !amzorderid || !amzorderdate || !asin) {
        // Salta la iteración actual si los datos son inválidos
        continue; //'Please fill in all fields for each product');
      }

      //Check if order ID already exists
      const productExists = await Product.findOne({amzorderid});

      if(productExists){
         // Salta la iteración actual si los datos son inválidos
        console.log(`Amazon Order ID: ${amzorderid} already registered.`);
        continue; //"Amazon Order ID already registered.");
      }

      //Eliminamos el simbolo de la moneda si existe
      const formattedPrice = price.replace('€', '').trim();

      // Create Product
      const newProduct = await Product.create({
        name,
        amzorderid,
        amzorderdate,
        asin,
        location,
        quantity,
        formattedPrice,
        description,
        isPublished,
        pendingPublish,
      });
      createdProducts.push(newProduct);
    }
    // Devolver los productos creados
    res.status(201).json({ createdProducts });
  } catch (error) {
    // Maneja errores generales aquí
    console.error('Error in createMultipleProducts:', error);
    res.status(500).json({ error: 'An error occurred' });
  }

};

// Get all Products
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort("-createdAt");
  res.status(200).json(products);
});

// Get single product
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.status(200).json(product);
});

// Delete Product
const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await Product.findById(productId);
    // if product doesnt exist
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    await Product.deleteOne({_id: productId});
    res.status(200).json({ message: "Product deleted." });
  }catch(error){
    res.status(400);
    throw new Error(error.message);
  }
});

// Update Product
const updateProduct = asyncHandler(async (req, res) => {
  const { name, amzorderid, amzorderdate, asin, location, quantity, price, description, isPublished, pendingPublish } = req.body;
  const { id } = req.params;

  const product = await Product.findById(id);

  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Handle Image upload
  let fileData = {};
  if (req.file) {
    // Save image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "MariniCatalog",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Update Product
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      { _id: id },
      {
        name,
        amzorderid,
        amzorderdate,
        asin,
        location,
        quantity,
        price,
        description,
        isPublished,
        pendingPublish,
        image: Object.keys(fileData).length === 0 ? product?.image : fileData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// ── Shared Amazon scraping helpers ───────────────────────────────────────────
const SCRAPE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Cache-Control": "max-age=0",
};

const parsePrice = (text) => {
  if (!text) return null;
  const cleaned = text.replace(/[€$£\s ]/g, "").replace(",", ".");
  const price = parseFloat(cleaned);
  return isNaN(price) ? null : price;
};

const fetchAmazonPrice = async (asin) => {
  const url = `https://www.amazon.es/dp/${asin}`;
  const { data } = await axios.get(url, { headers: SCRAPE_HEADERS, timeout: 12000 });
  const $ = cheerio.load(data);

  let price = null;

  $(".a-price .a-offscreen").each((_, el) => {
    if (price !== null) return;
    price = parsePrice($(el).text());
  });

  if (price === null) {
    for (const sel of [
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      "#price_inside_buybox",
      ".a-price-whole",
    ]) {
      if (price !== null) break;
      price = parsePrice($(sel).first().text());
    }
  }

  return price;
};
// ─────────────────────────────────────────────────────────────────────────────

// Update prices from Amazon.es by scraping (bulk)
const updatePrices = asyncHandler(async (req, res) => {
  const products = await Product.find({
    location: { $nin: ["PEND", "SOLD", "", null] },
    asin: { $exists: true, $ne: "" },
    $or: [{ price: { $lte: 1 } }, { price: null }, { price: { $exists: false } }],
  });

  const results = { updated: 0, failed: 0, skipped: 0 };
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const product of products) {
    if (!product.asin) { results.skipped++; continue; }

    try {
      await delay(700);
      const price = await fetchAmazonPrice(product.asin);
      if (price !== null) {
        await Product.findByIdAndUpdate(product._id, { price });
        results.updated++;
      } else {
        console.log(`No price found for ASIN ${product.asin}`);
        results.failed++;
      }
    } catch (error) {
      console.error(`Error fetching ASIN ${product.asin}:`, error.message);
      results.failed++;
    }
  }

  res.status(200).json({ message: "Precios actualizados", total: products.length, ...results });
});

// Update price for a single product
const updateSinglePrice = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error("Product not found"); }
  if (!product.asin) { res.status(400); throw new Error("El producto no tiene ASIN"); }

  const price = await fetchAmazonPrice(product.asin);
  if (price === null) {
    res.status(404);
    throw new Error(`No se encontro precio para ASIN ${product.asin}`);
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, { price }, { new: true });
  res.status(200).json({ price: updated.price });
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  createMultipleProducts,
  updatePrices,
  updateSinglePrice,
};
