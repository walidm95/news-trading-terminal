function formatNumberToCurrency(number) {
  var formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
  });

  return formatter.format(number);
}

export default {
  formatNumberToCurrency,
};
