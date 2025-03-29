const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); 

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to generate travel itinerary
async function generateItinerary(userPreferences) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Create a detailed travel itinerary based on the following preferences:
    
    Destination: ${userPreferences.destination}
    Start Date: ${userPreferences.startDate}
    End Date: ${userPreferences.endDate}
    Budget: ${userPreferences.budget} INR
    Interests: ${userPreferences.interests.join(', ')}
    Accommodation Preference: ${userPreferences.accommodationType}
    Transportation Preference: ${userPreferences.transportationType}
    
    Please structure the itinerary day by day including:
    1. Morning, afternoon, and evening activities
    2. Recommended restaurants for meals
    3. Estimated costs for each activity and meal
    4. Travel time between locations
    5. Accommodation recommendations
    6. Local tips and cultural insights
    
    Format the response as a structured JSON with the following format:
    {
      "destination": "City Name, Country",
      "duration": "X days",
      "totalEstimatedCost": "XXXX INR",
      "itinerary": [
        {
          "day": 1,
          "date": "YYYY-MM-DD",
          "activities": [
            {
              "time": "Morning",
              "activity": "Activity name",
              "description": "Brief description",
              "estimatedCost": "XX INR",
              "location": "Location name",
              "travelTime": "X minutes from previous location"
            },
            // ... more activities
          ],
          "meals": [
            {
              "type": "Breakfast/Lunch/Dinner",
              "recommendation": "Restaurant name",
              "cuisine": "Cuisine type",
              "estimatedCost": "XX INR",
              "location": "Location"
            },
            // ... more meals
          ],
          "accommodation": {
            "name": "Accommodation name",
            "type": "Hotel/Hostel/Airbnb",
            "estimatedCost": "XX INR",
            "location": "Location"
          }
        },
        // ... more days
      ],
      "additionalTips": [
        "Tip 1",
        "Tip 2",
        // ... more tips
      ]
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonStr = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
    let itinerary;
    
    if (jsonStr && jsonStr[1]) {
      itinerary = JSON.parse(jsonStr[1]);
    } else if (jsonStr) {
      itinerary = JSON.parse(jsonStr[0]);
    } else {
      throw new Error("Could not parse JSON from the response");
    }
    
    return itinerary;
  } catch (error) {
    console.error("Error generating itinerary:", error);
    throw error;
  }
}

// Function to get flight recommendations
async function getFlightRecommendations(origin, destination, date) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Provide flight recommendations from ${origin} to ${destination} on ${date}.
    Include flight details like estimated prices, airlines, departure and arrival times.
    Format as JSON array with the following structure:
    [
      {
        "airline": "Airline name",
        "flightNumber": "XX123",
        "departureTime": "HH:MM",
        "arrivalTime": "HH:MM",
        "duration": "Xh Ym",
        "price": "XXX USD",
        "stops": 0,
        "departureAirport": "XXX",
        "arrivalAirport": "YYY"
      },
      // more flights
    ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonStr = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[([\s\S]*?)\]/);
    let flights;
    
    if (jsonStr && jsonStr[1]) {
      flights = JSON.parse(jsonStr[1]);
    } else if (jsonStr) {
      flights = JSON.parse(jsonStr[0]);
    } else {
      throw new Error("Could not parse JSON from the response");
    }
    
    return flights;
  } catch (error) {
    console.error("Error getting flight recommendations:", error);
    throw error;
  }
}

// Function to get accommodation recommendations
async function getAccommodationRecommendations(destination, checkIn, checkOut, preferences) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Provide accommodation recommendations in ${destination} for check-in on ${checkIn} and check-out on ${checkOut}.
    Preferences: ${preferences}
    Include details like hotel names, prices, amenities, and location.
    Format as JSON array with the following structure:
    [
      {
        "name": "Accommodation name",
        "type": "Hotel/Hostel/Apartment",
        "pricePerNight": "XXX USD",
        "totalPrice": "XXX USD",
        "location": "Area in ${destination}",
        "rating": "X.X/5",
        "amenities": ["amenity1", "amenity2", ...],
        "description": "Brief description"
      },
      // more accommodations
    ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonStr = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[([\s\S]*?)\]/);
    let accommodations;
    
    if (jsonStr && jsonStr[1]) {
      accommodations = JSON.parse(jsonStr[1]);
    } else if (jsonStr) {
      accommodations = JSON.parse(jsonStr[0]);
    } else {
      throw new Error("Could not parse JSON from the response");
    }
    
    return accommodations;
  } catch (error) {
    console.error("Error getting accommodation recommendations:", error);
    throw error;
  }
}

// Function to get activity recommendations
async function getActivityRecommendations(destination, interests) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Provide activity recommendations in ${destination} based on these interests: ${interests.join(', ')}.
    Include details like activity names, descriptions, estimated costs, and durations.
    Format as JSON array with the following structure:
    [
      {
        "name": "Activity name",
        "category": "Category (e.g., Museum, Outdoor, Adventure)",
        "description": "Brief description",
        "estimatedCost": "XXX INR",
        "duration": "X hours",
        "location": "Location within ${destination}",
        "bestTimeToVisit": "Morning/Afternoon/Evening"
      },
      // more activities
    ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonStr = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[([\s\S]*?)\]/);
    let activities;
    
    if (jsonStr && jsonStr[1]) {
      activities = JSON.parse(jsonStr[1]);
    } else if (jsonStr) {
      activities = JSON.parse(jsonStr[0]);
    } else {
      throw new Error("Could not parse JSON from the response");
    }
    
    return activities;
  } catch (error) {
    console.error("Error getting activity recommendations:", error);
    throw error;
  }
}

// API Routes
app.post('/api/generate-itinerary', async (req, res) => {
  try {
    const userPreferences = req.body;
    const itinerary = await generateItinerary(userPreferences);
    res.json(itinerary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/flights', async (req, res) => {
  try {
    const { origin, destination, date } = req.body;
    const flights = await getFlightRecommendations(origin, destination, date);
    res.json(flights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/accommodations', async (req, res) => {
  try {
    const { destination, checkIn, checkOut, preferences } = req.body;
    const accommodations = await getAccommodationRecommendations(destination, checkIn, checkOut, preferences);
    res.json(accommodations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/activities', async (req, res) => {
  try {
    const { destination, interests } = req.body;
    const activities = await getActivityRecommendations(destination, interests);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});