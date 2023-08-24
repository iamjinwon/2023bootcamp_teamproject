const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const storagePath = path.join(__dirname, "../data");
const questionFilePath = path.join(storagePath, "questions.json");

const getConnection = require("../data/DBpool.js");

// 질문 목록 조회
router.get("/questions", (req, res) => {
  getConnection(function (conn) {
    const selectQuery = "SELECT * FROM Question";

    conn.query(selectQuery, function (error, results) {
      conn.release();
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "An error occurred while retrieving questions." });
        return;
      }
      res.json({ questions: results });
    });
  });
});


// 특정 질문 조회
router.get("/questions/:Question_ID", (req, res) => {
  const questionId = req.params.Question_ID;

  getConnection(function (conn) {
    const selectQuery = "SELECT * FROM Question WHERE Question_ID = ?";

    conn.query(selectQuery, [questionId], function (error, results) {
      conn.release();
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "An error occurred while retrieving the question." });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ error: "Question not found." });
        return;
      }

      res.json({ question: results[0] });
    });
  });
});

/* // Get List of Questions
router.get("/questions", (req, res) => {
  const questions = JSON.parse(fs.readFileSync(questionFilePath, "utf8"));
  res.json(questions);
});

// Get Question Details
router.get("/questions/:questionId", (req, res) => {
  const questions = JSON.parse(fs.readFileSync(questionFilePath, "utf8"));
  const questionId = req.params.questionId;

  const question = questions.find((q) => q.id === parseInt(questionId));
  if (!question) {
    return res.status(404).json({ message: "Question not found." });
  }

  res.json(question);
}); */

// // Write Your Questions
// router.post("/questions", (req, res) => {
// const questions = JSON.parse(fs.readFileSync(questionFilePath, "utf8"));
// const { title, content } = req.body;

// const newQuestion = {
//     id: questions.length + 1, // Simple auto-increment logic. Adjust as per your needs.
//     title,
//     content,
//     NickName 
//   };
//   questions.push(newQuestion);
//   fs.writeFileSync(questionFilePath, JSON.stringify(questions));

//   res.json({ message: "Question added successfully.", ...newQuestion });
// });

// 질문추가
router.post("/questions", (req, res) => {
  const { title, content, user_user_ID, NickName, Answer } = req.body;

  getConnection(function (conn) {
    const insertQuery = `
      INSERT INTO Question
      (content, CreateDate, title, user_user_ID, NickName, Answer)
      VALUES (?, NOW(), ?, ?, ?, ?)
    `;

    conn.query(
      insertQuery,
      [content, title, user_user_ID, NickName, Answer],
      function (error, results) {
        conn.release();
        if (error) {
          console.error("Error executing query:", error);
          res.status(500).json({ error: "An error occurred while adding the question." });
          return;
        }

        const newQuestion = {
          Question_ID: results.insertId,
          content,
          CreateDate: new Date().toISOString(),
          title,
          user_user_ID,
          NickName,
          Answer,
        };

        res.json({ message: "Question added successfully.", ...newQuestion });
      }
    );
  });
});


// 질문 수정
router.post("/questions/:Question_ID", (req, res) => {
  const questionId = req.params.Question_ID;
  const { title, content } = req.body;

  getConnection(function (conn) { 
    const updateQuery = `
      UPDATE Question
      SET title = ?, content = ?
      WHERE Question_ID = ?
    `;

    conn.query(
      updateQuery,
      [title, content, questionId],
      function (error, results) {
        conn.release();
        if (error) {
          console.error("Error executing query:", error);
          res.status(500).json({ error: "An error occurred while updating the question." });
          return;
        }

        res.json({ message: "Question updated successfully." });
      }
    );
  });
});

router.delete("/questions/:Question_ID", (req, res) => {
  const questionId = req.params.Question_ID;

  getConnection(function (conn) {
    const deleteQuery = "DELETE FROM Question WHERE Question_ID = ?";

    conn.query(deleteQuery, [questionId], function (error, results) {
      conn.release();
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "An error occurred while deleting the question." });
        return;
      }

      res.json({ message: "Question deleted successfully." });
    });
  });
});


// 특정 질문에 대한 답변 추가 (user_ID가 "admin"일 경우에만)
router.post("/questions/:Question_ID/:user_ID", (req, res) => {
  const questionId = req.params.Question_ID;
  const { Answer } = req.body;

  // 세션에서 user_ID 확인
  const user_ID = req.session.user.userID;
  console.log(req.session.user.userID);

  if (user_ID === "admin") {
    getConnection(function (conn) {
      const updateQuery = `
        UPDATE Question
        SET Answer = ?
        WHERE Question_ID = ?
      `;

      conn.query(
        updateQuery,
        [Answer, questionId],
        function (error, results) {
          conn.release();
          if (error) {
            console.error("Error executing query:", error);
            res.status(500).json({ error: "An error occurred while updating the question." });
            return;
          }

          res.json({ message: "Answer added to the question." });
        }
      );
    });
  } else {
    res.status(403).json({ error: "You do not have permission to add an answer." });
  }
});


module.exports = router;

/* // Edit Question
router.post("/questions/:questionId", (req, res) => {
  const questions = JSON.parse(fs.readFileSync(questionFilePath, "utf8"));
  const { title, content } = req.body;
  const questionId = req.params.questionId;

  const index = questions.findIndex((q) => q.id === parseInt(questionId));
  if (index === -1) {
    return res.status(404).json({ message: "Question not found." });
  }

  questions[index].title = title;
  questions[index].content = content;

  fs.writeFileSync(questionFilePath, JSON.stringify(questions));
  res.json({ message: "Question updated successfully.", ...questions[index] });
});

// Add Answer (Only accessible by admin with specific userID)
router.post("/questions/:questionId/:userID", (req, res) => {
  const questions = JSON.parse(fs.readFileSync(questionFilePath, "utf8"));
  const { answer } = req.body; // answer 속성

  const questionId = req.params.questionId;
  const userID = req.params.userID; // 관리자의 userID

  // 관리자인지 여부를 확인하는 로직 (예시로 "admin123"이 관리자의 userID라고 가정)
  if (userID !== "admin123") {
    return res
      .status(403)
      .json({ message: "Access denied. Only admin can add answer." });
  }

  const index = questions.findIndex((q) => q.id === parseInt(questionId));
  if (index === -1) {
    return res.status(404).json({ message: "Question not found." });
  }

  // 관리자만 answer 속성을 추가할 수 있도록 처리
  questions[index].answer = answer;

  fs.writeFileSync(questionFilePath, JSON.stringify(questions));
  res.json({ message: "Answer added successfully.", ...questions[index] });
});

// Delete Question
router.delete("/questions/:questionId", (req, res) => {
  const questions = JSON.parse(fs.readFileSync(questionFilePath, "utf8"));
  const questionId = req.params.questionId;

  const newQuestions = questions.filter((q) => q.id !== parseInt(questionId));
  fs.writeFileSync(questionFilePath, JSON.stringify(newQuestions));

  res.json({ message: "Question deleted successfully." });
}); */

module.exports = router;
