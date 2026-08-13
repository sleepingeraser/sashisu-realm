const request = require("supertest");
const app = require("../../server");

describe("GET /api/health", () => {
  test("should return 200 OK and correct response structure", async () => {
    // arrange
    const expectedStatus = 200;

    // act
    const response = await request(app).get("/api/health");

    // assert
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty("ok", true);
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).toHaveProperty("environment");
    expect(response.body).toHaveProperty(
      "message",
      "Sashisu Realm API is running",
    );
  });

  test("should return JSON content type", async () => {
    // arrange & Act
    const response = await request(app).get("/api/health");

    // assert
    expect(response.headers["content-type"]).toMatch(/json/);
  });
});
