import express from "express";
import { RateLimiterMongo } from "rate-limiter-flexible";
import { MongoClient } from "mongodb";

async function main() {
  const app = express();
  const port = 8888;

  const mongo = new MongoClient("mongodb://localhost:27017");
  await mongo.connect();

  const limiter = new RateLimiterMongo({
    storeClient: mongo,
    dbName: "rate_limiter",
    tableName: "rate_limiter",
    keyPrefix: "middleware",
    points: 10,
    duration: 30,
  });

  let count = 0;
  let rejectTime = undefined;

  app.get("/", async (req, res) => {
    try {
      await limiter.consume(req.ip, 1);

      if (rejectTime !== undefined) {
        const diff = Date.now() - rejectTime;
        const inSeconds = Math.round(diff / 1000);

        console.log(`Rejected for ${inSeconds} seconds`);
      }
      rejectTime = undefined;

      console.log(++count);
      res.send("Hello World!");
    } catch (rejRes) {
      if (rejectTime === undefined) {
        rejectTime = Date.now();
      }

      res.status(429).send("Too Many Requests");
    }
  });

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
}
void main();
