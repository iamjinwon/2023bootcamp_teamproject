const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const storagePath = path.join(__dirname, "../data");
const userFilePath = path.join(storagePath, "favorite.json");
const getConnection = require("../data/DBpool.js");

// // Function to read users from the JSON file
// const readFavorites = () => {
//   try {
//     const usersJson = fs.readFileSync(userFilePath, "utf8");
//     return JSON.parse(usersJson);
//   } catch (error) {
//     console.error("Error reading users from file:", error.message);
//     return [];
//   }
// };

// // Registration route
// router.post("/", (req, res) => {
//   const userSession = req.session.user;
//   if (!userSession) {
//     return res
//       .status(401)
//       .json({ isRegistered: false, message: "session expired login please" });
//   }

//   //파일을 통해 즐겨찾기 구현 DB사용시 아래 코드 주석처리
//   let favorites = readFavorites();
//   console.log("beforeFavorites", favorites);
//   //check if the movieID already exists in the favorites array
//   let userIndex = null;
//   for (let i = 0; i < favorites.length; i++) {
//     if (favorites[i].userId === userSession.userID) {
//       userIndex = i;
//     }
//   }
//   //json에 user가 없으면 추가
//   if (userIndex === null) {
//     favorites.push({ userId: userSession.userID, favoriteList: [] });
//   }
//   console.log("findUser", favorites[userIndex]);
//   const isExistingFavorite = favorites[userIndex].favoriteList.find(
//     (favorite) => favorite.movieId === req.body.movieId
//   );
//   console.log("existingFavorite", isExistingFavorite);
//   if (isExistingFavorite) {
//     return res
//       .status(409)
//       .json({ isRegistered: false, message: "movieID already exists" });
//   }
//   // Save the new user in the users array
//   favorites[userIndex].favoriteList.push(req.body.movieId);
//   // Write the updated users array to the JSON file
//   fs.writeFile(userFilePath, JSON.stringify(favorites), (err) => {
//     if (err) {
//       console.error("Error saving user data to file:", err.message);
//       return res
//         .status(500)
//         .json({ isRegistered: false, error: "Error saving user data" });
//     } else {
//       console.log("favorite data saved to user.json successfully.");
//       console.log("after " + JSON.stringify(favorites));
//       // Registration successful
//       return res.json({
//         favorites: favorites[userIndex].favoriteList,
//         message: "Successful saved",
//       });
//     }
//   });

  // DB와 연결 코드 사용 시 위 코드 주석 처리 하고 아래 코드 주석 해제
  const checkQuery =
    "SELECT * FROM MoviesMark WHERE Movie_Movie_ID = ? AND user_user_ID = ?";
  const checkValues = [req.body.movieId, userSession.userID];
  getConnection((conn) => {
    conn.query(checkQuery, checkValues, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("An error occurred");
        conn.release();
        return;
      }
      if (result.length > 0) {
        res.status(409).json({
          isSuccess: false,
          message: "movieID already exists in MoviesMark",
        });
        conn.release();
      } else {
        // Add movie to user's favorites
        const addQuery =
          "INSERT INTO MoviesMark (Movie_Movie_ID, user_user_ID, CreateDate) VALUES (?, ?, NOW())";
        conn.query(addQuery, checkValues, (err, result) => {
          console.log(result);
          if (err) {
            console.error(err);
            res.status(500).send("An error occurred while adding to favorites");
            conn.release();
            return;
          }
          res.status(200).json({
            isSuccess: true,
            message: "Movie added to favorites successfully",
          });
          conn.release();
        });
      }
    });
  });
// });

module.exports = router;
