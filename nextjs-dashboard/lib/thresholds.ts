// Seuils pour les valeurs brutes du capteur GMXXX
// Basé sur la logique du flow Node-RED: airIndex = max(NO2, Ethanol, VOC, CO)
export function getAirQualityColor(quality: string) {
  switch (quality) {
    case "faible":
      return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500", label: "Bon" };
    case "modere":
      return { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500", label: "Modere" };
    case "eleve":
      return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500", label: "Eleve" };
    case "critique":
      return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Critique" };
    default:
      return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-400", label: quality };
  }
}

export function getTempColor(temp: number) {
  if (temp >= 18 && temp <= 26) return "text-green-700";
  if (temp >= 10 && temp <= 32) return "text-yellow-700";
  return "text-red-700";
}

export function getGasColor(value: number) {
  if (value < 5000) return "text-green-700";
  if (value < 15000) return "text-yellow-700";
  return "text-red-700";
}
