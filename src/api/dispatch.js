// Mock data
const mockDispatchData = {
  identificationNumber: "DS-2024-001",
  effectiveDate: new Date().toLocaleDateString('en-GB'),
  revisionNumber: "Rev 1.0",
  customerName: "Amul Dairy",
  dateOfDispatch: new Date().toLocaleDateString('en-GB'),
  truckNumber: "MH-12-AB-1234",
  driverNumber: "DRV-9876543210",
  timeOfDispatch: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  preCoolTemperature: "4°C",
  coolingDockTemperature: "2°C",
  pestInfestation: "NO",
  vehicleCleaned: "YES",
  products: [
    {
      product: "Full Cream Milk",
      manufactureDate: "22/12/2024",
      expiryDate: "25/12/2024",
      batchNo: "FCM-2024-456",
      quantity: "500 L",
      dispatchTemperature: "4°C",
      truckTemperature: "3°C",
      comment: "Good condition",
      sign: ""
    },
    {
      product: "Toned Milk",
      manufactureDate: "22/12/2024",
      expiryDate: "25/12/2024",
      batchNo: "TM-2024-789",
      quantity: "300 L",
      dispatchTemperature: "4°C",
      truckTemperature: "3°C",
      comment: "Good condition",
      sign: ""
    }
  ]
};

export default mockDispatchData