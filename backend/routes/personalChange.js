const express = require("express");
const router = express.Router();
const getConnection = require("../data/DBpool.js");

// Disable foreign key checks
const disableForeignKeyChecks = (conn, callback) => {
  conn.query("SET FOREIGN_KEY_CHECKS = 0", (error) => {
    if (error) {
      console.error("Error disabling foreign key checks:", error);
      return callback(error);
    }
    callback(null);
  });
};

// Enable foreign key checks
const enableForeignKeyChecks = (conn, callback) => {
  conn.query("SET FOREIGN_KEY_CHECKS = 1", (error) => {
    if (error) {
      console.error("Error enabling foreign key checks:", error);
      return callback(error);
    }
    callback(null);
  });
};

router.post("/:userId/profile", (req, res) => {
  const userId = req.params.userId;
  const nickname = req.body.NickName;
  const password = req.body.user_Password;

  getConnection((conn) => {
    conn.beginTransaction((err) => {
      if (err) {
        console.error("Error starting transaction:", err);
        return res.status(500).json({ isUpdated: false, error: "Error starting transaction" });
      }

      disableForeignKeyChecks(conn, (disableError) => {
        if (disableError) {
          conn.rollback(() => {
            console.error("Error during transaction:", disableError);
            res.status(500).json({ isUpdated: false, error: "Error during transaction" });
          });
        } else {
          const updateUserQuery = "UPDATE user SET NickName = ?, user_Password = ? WHERE user_ID = ?";
          const updateQuestionQuery = "UPDATE Question SET NickName = ? WHERE NickName = ?";

          conn.query(updateUserQuery, [nickname, password, userId], (error1, results1) => {
            if (error1) {
              conn.rollback(() => {
                console.error("Error updating user profile:", error1);
                res.status(500).json({ isUpdated: false, error: "Error updating user profile" });
              });
            } else {
              conn.query(updateQuestionQuery, [nickname, userId], (error2, results2) => {
                if (error2) {
                  conn.rollback(() => {
                    console.error("Error updating Question NickName:", error2);
                    res.status(500).json({ isUpdated: false, error: "Error updating Question NickName" });
                  });
                } else {
                  enableForeignKeyChecks(conn, (enableError) => {
                    if (enableError) {
                      conn.rollback(() => {
                        console.error("Error during transaction:", enableError);
                        res.status(500).json({ isUpdated: false, error: "Error during transaction" });
                      });
                    } else {
                      conn.commit((commitError) => {
                        if (commitError) {
                          conn.rollback(() => {
                            console.error("Error committing transaction:", commitError);
                            res.status(500).json({ isUpdated: false, error: "Error committing transaction" });
                          });
                        } else {
                          console.log("User profile and Question NickName updated");
                          res.json({ isUpdated: true });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  });
});

module.exports = router;
