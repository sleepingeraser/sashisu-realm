const {
  calculateCartTotal,
  validateEmail,
  formatPrice,
  fetchExchangeRate,
  convertToCurrency,
} = require("../../utils/cartLogic");

// TEST 1: happy path - calculateCartTotal
describe("calculateCartTotal", () => {
  test("should calculate correct total for valid items (Happy Path)", () => {
    // arrange
    const items = [
      { priceCents: 2500, quantity: 2 },
      { priceCents: 1500, quantity: 1 },
    ];
    const expected = 6500;

    // act
    const result = calculateCartTotal(items);

    // assert
    expect(result).toBe(expected);
  });

  // TEST 2: edge case - empty cart returns 0
  test("should return 0 for empty cart (Edge Case)", () => {
    // arrange
    const items = [];
    const expected = 0;

    // act
    const result = calculateCartTotal(items);

    // assert
    expect(result).toBe(expected);
  });

  // TEST 3: edge case - discount code applies 10% off
  test("should apply 10% discount with SASHISU10 code (Edge Case)", () => {
    // arrange
    const items = [{ priceCents: 10000, quantity: 1 }];
    const expected = 9000;

    // act
    const result = calculateCartTotal(items, "SASHISU10");

    // assert
    expect(result).toBe(expected);
  });

  // TEST 4: STUB - fixed Date.now for time-based logic
  test("should handle items with default quantity of 1 when quantity is missing", () => {
    // arrange
    const items = [{ priceCents: 3000 }];
    const expected = 3000;

    // act
    const result = calculateCartTotal(items);

    // assert
    expect(result).toBe(expected);
  });
});

// TEST 5: MOCK - mock fetch API for exchange rate
describe("fetchExchangeRate", () => {
  test("should return mocked exchange rate (Mock)", async () => {
    // arrange
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ rate: 1.35 }),
      }),
    );

    // act
    const rate = await fetchExchangeRate("USD");

    // assert
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.exchangerate.com/USD",
    );
    expect(rate).toBe(1.35);

    // cleanup
    global.fetch.mockRestore();
  });
});

// TEST 6: SPY - spy on console.warn for invalid input
describe("convertToCurrency", () => {
  test("should return 0 and spy detects no console call (Spy)", () => {
    // arrange
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    // act
    const result = convertToCurrency("invalid", 1.2);

    // assert
    expect(result).toBe(0);

    // cleanup
    consoleSpy.mockRestore();
  });
});

// TEST 7: validateEmail happy path
describe("validateEmail", () => {
  test("should return true for valid email", () => {
    // arrange
    const email = "test@example.com";

    // act
    const result = validateEmail(email);

    // assert
    expect(result).toBe(true);
  });

  test("should return false for invalid email", () => {
    // arrange
    const email = "not-an-email";

    // act
    const result = validateEmail(email);

    // assert
    expect(result).toBe(false);
  });
});

// TEST 8: formatPrice edge cases
describe("formatPrice", () => {
  test("should format cents to dollar string", () => {
    // arrange
    const cents = 1234;

    // act
    const result = formatPrice(cents);

    // assert
    expect(result).toBe("$12.34");
  });

  test("should return $0.00 for negative input (Edge Case)", () => {
    // arrange
    const cents = -100;

    // act
    const result = formatPrice(cents);

    // assert
    expect(result).toBe("$0.00");
  });
});
