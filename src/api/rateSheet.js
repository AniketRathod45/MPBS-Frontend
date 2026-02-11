export async function fetchRateAndAmount({ milkType, fat, snf, qty }) {
  await new Promise((res) => setTimeout(res, 300));

  if (!milkType || fat === "" || snf === "") {
    return { rate: "", amount: "" };
  }

  const rate = milkType === "Cow" ? 32 : 45;

  // If qty exists → Milk Collection
  if (qty) {
    return {
      rate,
      amount: (Number(qty) * rate).toFixed(2),
    };
  }

  return { rate };
}
