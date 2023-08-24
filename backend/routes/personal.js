const express = require("express");
const router = express.Router();
// const fs = require("fs");
// const path = require("path");

const getConnection = require("../data/DBpool.js");
// const userDataPath = path.join(__dirname, "../data/user.json");

// // Define the route for getting user profiles
// router.get("/:userId/profile", (req, res) => {
//   const userId = req.params.userId;
//   console.log(`Requested userId: ${userId}`);

//   fs.readFile(userDataPath, "utf8", (err, data) => {
//     if (err) {
//       console.error("Error reading user data file:", err.message);
//       return res.status(500).json({ error: "Internal server error" });
//     }

//     const users = JSON.parse(data);
//     const user = users.find((user) => user.userID === userId);

//     if (!user) {
//       console.log(`User not found for userId: ${userId}`);
//       return res.status(404).json({ error: "User not found" });
//     }

//     const { userID, username, email, nickname } = user;
//     console.log(`Found user:`, user);
//     res.json({ userID, username, email, nickname });
//   });
// });

// Define the route for getting user profiles
router.get("/:userId/profile", (req, res) => {
  const userId = req.params.userId;
  console.log(`Requested userId: ${userId}`);

  getConnection(function (conn) {
    const selectQuery = "SELECT NickName, user_Password FROM user WHERE user_ID = ?";

    conn.query(selectQuery, [userId], (error, results) => {
      conn.release(); // 연결 해제

      if (error) {
        console.error("Error querying the database:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length === 0) {
        console.log(`User not found for userId: ${userId}`);
        return res.status(404).json({ error: "User not found" });
      }

      const user = results[0];
      const { NickName, user_Password } = user;
      console.log(`Found user:`, user);
      res.json({ NickName, user_Password });
    });
  });
});
module.exports = router;
