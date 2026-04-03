// Expanded mandi list (pan-India). Coordinates are approximate.
const MANDIS = [
  // Maharashtra
  { id: "lasalgaon", name: "Lasalgaon APMC", district: "Nashik", state: "Maharashtra", lat: 20.1428, lng: 74.2401 },
  { id: "nashik", name: "Nashik APMC", district: "Nashik", state: "Maharashtra", lat: 19.9975, lng: 73.7898 },
  { id: "pune", name: "Pune Market Yard", district: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { id: "nagpur", name: "Nagpur APMC", district: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882 },
  { id: "solapur", name: "Solapur APMC", district: "Solapur", state: "Maharashtra", lat: 17.6599, lng: 75.9064 },
  { id: "kolhapur", name: "Kolhapur Market", district: "Kolhapur", state: "Maharashtra", lat: 16.7049, lng: 74.2433 },

  // Gujarat
  { id: "ahmedabad", name: "Ahmedabad APMC", district: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
  { id: "surat", name: "Surat Market", district: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311 },
  { id: "rajkot", name: "Rajkot APMC", district: "Rajkot", state: "Gujarat", lat: 22.3039, lng: 70.8022 },
  { id: "vadodara", name: "Vadodara Market", district: "Vadodara", state: "Gujarat", lat: 22.3072, lng: 73.1812 },

  // Delhi & NCR
  { id: "azadpur", name: "Azadpur Mandi", district: "North Delhi", state: "Delhi", lat: 28.7056, lng: 77.1734 },
  { id: "okhla", name: "Okhla Mandi", district: "South Delhi", state: "Delhi", lat: 28.5482, lng: 77.2860 },
  { id: "ghazipur", name: "Ghazipur Mandi", district: "East Delhi", state: "Delhi", lat: 28.6121, lng: 77.3150 },
  { id: "gurugram", name: "Gurugram Mandi", district: "Gurugram", state: "Haryana", lat: 28.4595, lng: 77.0266 },
  { id: "noida", name: "Noida Market", district: "Gautam Buddh Nagar", state: "Uttar Pradesh", lat: 28.5355, lng: 77.3910 },

  // Rajasthan
  { id: "jaipur", name: "Jaipur APMC", district: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { id: "kota", name: "Kota Mandi", district: "Kota", state: "Rajasthan", lat: 25.2138, lng: 75.8648 },
  { id: "udaipur", name: "Udaipur Mandi", district: "Udaipur", state: "Rajasthan", lat: 24.5854, lng: 73.7125 },
  { id: "bikaner", name: "Bikaner Market", district: "Bikaner", state: "Rajasthan", lat: 28.0229, lng: 73.3119 },

  // Uttar Pradesh
  { id: "lucknow", name: "Lucknow APMC", district: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { id: "kanpur", name: "Kanpur Mandi", district: "Kanpur Nagar", state: "Uttar Pradesh", lat: 26.4499, lng: 80.3319 },
  { id: "varanasi", name: "Varanasi Market", district: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739 },
  { id: "meerut", name: "Meerut Mandi", district: "Meerut", state: "Uttar Pradesh", lat: 28.9845, lng: 77.7064 },
  { id: "agra", name: "Agra APMC", district: "Agra", state: "Uttar Pradesh", lat: 27.1767, lng: 78.0081 },

  // Madhya Pradesh
  { id: "indore", name: "Indore Mandi", district: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
  { id: "bhopal", name: "Bhopal Mandi", district: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126 },
  { id: "jabalpur", name: "Jabalpur Market", district: "Jabalpur", state: "Madhya Pradesh", lat: 23.1815, lng: 79.9864 },
  { id: "gwalior", name: "Gwalior APMC", district: "Gwalior", state: "Madhya Pradesh", lat: 26.2183, lng: 78.1828 },

  // Bihar & Jharkhand
  { id: "patna", name: "Patna Mandi", district: "Patna", state: "Bihar", lat: 25.5941, lng: 85.1376 },
  { id: "gaya", name: "Gaya Market", district: "Gaya", state: "Bihar", lat: 24.7955, lng: 85.0002 },
  { id: "ranchi", name: "Ranchi Mandi", district: "Ranchi", state: "Jharkhand", lat: 23.3441, lng: 85.3096 },
  { id: "dhanbad", name: "Dhanbad Market", district: "Dhanbad", state: "Jharkhand", lat: 23.7957, lng: 86.4304 },

  // West Bengal & North-East
  { id: "kolkata", name: "Kolkata Market", district: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
  { id: "siliguri", name: "Siliguri Mandi", district: "Darjeeling", state: "West Bengal", lat: 26.7271, lng: 88.3953 },
  { id: "guwahati", name: "Guwahati Market", district: "Kamrup", state: "Assam", lat: 26.1445, lng: 91.7362 },
  { id: "agartala", name: "Agartala Mandi", district: "West Tripura", state: "Tripura", lat: 23.8315, lng: 91.2868 },

  // Karnataka
  { id: "bengaluru", name: "Bengaluru APMC", district: "Bengaluru Urban", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { id: "hubballi", name: "Hubballi Mandi", district: "Dharwad", state: "Karnataka", lat: 15.3647, lng: 75.1239 },
  { id: "mysuru", name: "Mysuru Market", district: "Mysuru", state: "Karnataka", lat: 12.2958, lng: 76.6394 },

  // Telangana & Andhra Pradesh
  { id: "hyderabad", name: "Hyderabad Market", district: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867 },
  { id: "warangal", name: "Warangal Mandi", district: "Warangal", state: "Telangana", lat: 17.9689, lng: 79.5941 },
  { id: "vijayawada", name: "Vijayawada Market", district: "Krishna", state: "Andhra Pradesh", lat: 16.5062, lng: 80.648 },
  { id: "visakhapatnam", name: "Visakhapatnam Mandi", district: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 },

  // Tamil Nadu & Kerala
  { id: "chennai", name: "Chennai Koyambedu", district: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { id: "coimbatore", name: "Coimbatore Mandi", district: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
  { id: "madurai", name: "Madurai Market", district: "Madurai", state: "Tamil Nadu", lat: 9.9252, lng: 78.1198 },
  { id: "kochi", name: "Kochi Mandi", district: "Ernakulam", state: "Kerala", lat: 9.9312, lng: 76.2673 },
  { id: "thiruvananthapuram", name: "Thiruvananthapuram Market", district: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lng: 76.9366 },

  // Punjab & Haryana
  { id: "ludhiana", name: "Ludhiana Mandi", district: "Ludhiana", state: "Punjab", lat: 30.901, lng: 75.8573 },
  { id: "amritsar", name: "Amritsar Market", district: "Amritsar", state: "Punjab", lat: 31.634, lng: 74.8723 },
  { id: "hisar", name: "Hisar APMC", district: "Hisar", state: "Haryana", lat: 29.1492, lng: 75.7217 },
  { id: "karnal", name: "Karnal Mandi", district: "Karnal", state: "Haryana", lat: 29.6857, lng: 76.9905 },

  // Chhattisgarh & Odisha
  { id: "raipur", name: "Raipur Mandi", district: "Raipur", state: "Chhattisgarh", lat: 21.2514, lng: 81.6296 },
  { id: "bilaspur", name: "Bilaspur Market", district: "Bilaspur", state: "Chhattisgarh", lat: 22.0797, lng: 82.1409 },
  { id: "bhubaneswar", name: "Bhubaneswar Mandi", district: "Khurda", state: "Odisha", lat: 20.2961, lng: 85.8245 },
  { id: "cuttack", name: "Cuttack Market", district: "Cuttack", state: "Odisha", lat: 20.4625, lng: 85.8828 },
];

module.exports = { MANDIS };
