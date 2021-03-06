"use strict";
const path = require("path");
const router = require("express").Router();
const userController = require("../controllers/userController");

// mailer
const generateVerifyMail = require("../middlewares/mailer/generate/generateVerifyMsg");
const sendMail = require("../middlewares/mailer/sendMail");

// checks
const checkToken = require("../middlewares/check/checkToken");
const checkLastMailTime = require("../middlewares/check/checkLastMailTime");
const checkVerifyUser = require("../middlewares/check/checkVerifyUser");
const checkVerifyHash = require("../middlewares/check/checkVerifyHash");

//add
const addVerifyUser = require("../middlewares/add/addVerifyUser");
const addToken = require("../middlewares/add/addToken");

// configurations
router.use((req, res, next) => {
  req.app.set(
    "layout",
    path.join(__dirname, "../views/layouts/userLayout.ejs")
  );
  next();
});

// middlewares

// check is user loged in
router.use((req, res, next) => {
  if (!req.session.isAuth) return res.redirect("/login");
  return next();
});

// check is user verificated email
router.use(checkVerifyUser, addToken);

// routes

router
  .route("/create-group")
  .get(userController.createGroup)
  .post(checkToken, userController.createGroupPOST);
router.route("/chat/:roomId").get(userController.chatRoom);

router.route("/create-room/:userEmail").get(userController.createRoom);

router
  .route("/verify-mail/:hash")
  .get(checkVerifyHash, addVerifyUser, userController.verifyMail);
router
  .route("/send-verify-mail")
  .get(
    checkLastMailTime,
    generateVerifyMail,
    sendMail,
    userController.sendVerifyMail
  );
router.route("/logout").post(checkToken, userController.logoutPOST);
router.route("/").get(userController.index);

// 404 page error

router.use((req, res) => {
  res.status(404);
  if (req.accepts("html")) return res.render("user/404");
  if (req.accepts("json")) return res.json({ error: "Not found!" });
  return res.type("txt").send("Not found !");
});

module.exports = router;
