import ServiceRequest from '../../models/ServiceRequest.js';
import { mapRequests } from './serviceRequestHelpers.js';

// GET - Get all service requests
export const getAllServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find().sort({ createdAt: -1 });
    res.status(200).json(mapRequests(requests));
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service requests",
      error: error.message,
    });
  }
};
