const asyncHandler = require("express-async-handler");
const Location = require("../models/locationModel");

// Create Prouct
const createLocation = asyncHandler(async (req, res) => {
  const {location} = req.body;

  console.log(req.body);
  //   Validation
  if (!location) {
    res.status(400);
    throw new Error("Please fill location field");
  }

  //Check if user email already exists
    const locationExists = await Location.findOne({location});

    if(locationExists){
        res.status(400);
        throw new Error("Location already registered.");
    }

  // Create location
  const newLocation = await Location.create({
    location
  });

  res.status(201).json(newLocation);
});

const createMultipleLocations = async (req, res) => {
  try {
    const locationsData = req.body; // Arreglo de objetos con datos de locationos

    // Validación
    if (!Array.isArray(locationsData) || locationsData.length === 0) {
      res.status(400);
      throw new Error('Please provide an array of locations');
    }

    const createdlocations = [];

    // Iterar sobre los datos de locationos y crear cada uno
    for (const locationData of locationsData) {
      const {
        location,
      } = locationData;

      // Validación para cada locationo
      if (!location) {
        // Salta la iteración actual si los datos son inválidos
        continue; //'Please fill in all fields for each location');
      }

      //Check if user email already exists
      const locationExists = await Location.findOne({location});

      if(locationExists){
         // Salta la iteración actual si los datos son inválidos
        console.log(`Location: ${location} already registered.`);
        continue; //"Amazon Order ID already registered.");
      }

      // Create location
      const newlocation = await Location.create({
        location
      });
      createdlocations.push(newlocation);
    }
    // Devolver los locationos creados
    res.status(201).json({ createdlocations });
  } catch (error) {
    // Maneja errores generales aquí
    console.error('Error in createMultiplelocations:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
  
};

// Get all locations
const getLocations = asyncHandler(async (req, res) => {
  const locations = await location.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json(locations);
});


// Delete location
const deleteLocation = asyncHandler(async (req, res) => {
  const locationId = req.params.id;

  try {
    const location = await location.findById(locationId);
    // if location doesnt exist
    if (!location) {
      res.status(404);
      throw new Error("location not found");
    }
    await location.deleteOne({_id: locationId});
    res.status(200).json({ message: "location deleted." });
  }catch(error){
    res.status(400);
    throw new Error(error.message);
  }
});



module.exports = {
  createLocation,
  getLocations,
  deleteLocation,
  createMultipleLocations
};