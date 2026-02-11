// bmcMock.js

// Generate dynamic current date/time for the mock entries
const now = new Date();
const currentTimestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
const currentDateISO = now.toISOString().split('T')[0]; // YYYY-MM-DD

export const mockBMCSocieties = [
  {
    id: "soc_001",
    name: "Andhral Society",
    verified: false,
    session: "M",
    date: Date.now(),
    time: currentTimestamp,
    entries: [
      { milkType: "Cow", fat: 3.5, snf: 8.5, qty: 120, rate: 32, amount: 3840 },
      { milkType: "Buffalo", fat: 6.5, snf: 9.0, qty: 80, rate: 45, amount: 3600 }
    ]
  },
  {
    id: "soc_002",
    name: "Raichur Society",
    verified: false,
    session: "M",
    date: Date.now(),
    time: currentTimestamp, // This will show the actual real time it was loaded
    entries: [
      { milkType: "Cow", fat: 3.2, snf: 8.3, qty: 90, rate: 31, amount: 2790 }
    ]
  },
  {
    id: "soc_003",
    name: "Hobli Society",
    verified: true, 
    session: "M",
    date: Date.now(),
    time: currentTimestamp,
    entries: [
      { milkType: "Buffalo", fat: 7.0, snf: 9.5, qty: 100, rate: 46, amount: 4600 }
    ]
  }
];

export const markSocietyAsVerified = (societyId) => {
  const society = mockBMCSocieties.find(s => s.id === societyId);
  if (society) society.verified = true;
};