const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;

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

  //Check if user email already exists
    const productExists = await Product.findOne({amzorderid});

    if(productExists){
        res.status(400);
        throw new Error("Amazon Order ID already registered.");
    }

  // Create Product
  const product = await Product.create({
    user: req.user.id,
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

      //Check if user email already exists
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
        user: req.user.id,
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
  const products = await Product.find({ user: req.user.id }).sort("-createdAt");
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
  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
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
    // Match product to its user
    if (product.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error("User not authorized");
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
  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
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

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  createMultipleProducts
};