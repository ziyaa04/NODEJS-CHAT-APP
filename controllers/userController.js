const Users = require("../models/Users");
const Rooms = require("../models/Rooms");

const { v4: uuid4 } = require("uuid");

const checkUserExists = require("../middlewares/check/checkUserExists");
const checkPrivateRoomWithUser = require("../middlewares/check/checkPrivateRoomWithUser");

const createPrivateRoom = require("../middlewares/create/createPrivateRoom");
// GET
const getUsers = require('../middlewares/get/getUsers');
const getChats = require("../middlewares/get/getChats");
// check
const checkRoomExists = require("../middlewares/check/checkRoomExists");

module.exports.index = async (req, res) => {
  res.locals._token = req.session._token;
  res.locals.email = req.session.email;
  // get users and rooms
  try {
    res.locals.users = await getUsers(req.session.email);
    console.log(res.locals.users);

    res.locals.rooms = await getChats(req.session.email);
  } catch (e) {
    return res.redirect("/user/404");
  }

  return res.render("user/index");
};

module.exports.verifyMail = (req, res) => {
  if (req.verifyError) {
    return res.redirect("/");
  }

  req.session.isVerified = true;
  delete req.session.verifyHash;
  return res.redirect("/user");
};

module.exports.sendVerifyMail = (req, res) => {
  res.locals._token = req.session._token;
  if (req.errors) res.locals.errors = req.errors;
  res.render("user/send-verify-mail");
};

module.exports.createRoom = async (req, res) => {
  try {
    const isUserExists = await checkUserExists(req.params.userEmail);
    if (!isUserExists || req.params.userEmail === req.session.email)
      return res.redirect("/user/404");
    const room = await checkPrivateRoomWithUser(
      req.params.userEmail,
      req.session.email
    );
    if (room) return res.redirect("/user/chat/" + room.id);
    const createdRoom = await createPrivateRoom(
      req.session.email,
      req.params.userEmail
    );
    if (!createdRoom) return res.render("404");
    return res.redirect("/user/chat/" + createdRoom.id);
  } catch (e) {
    return res.redirect("/user/404");
  }
};

module.exports.chatRoom = async (req, res) => {
  res.locals._token = req.session._token;
  res.locals.email = req.session.email;

  // get users and rooms
  try {
    res.locals.currentRoom = await checkRoomExists(req.params.roomId);
    if (!res.locals.currentRoom) return res.redirect("/user/404"); // if not exists chat
    
    if (
      !res.locals.currentRoom.users.find(
        (elem) => elem.email === req.session.email
      )
    )
      //check is user in chat ?
      return res.redirect("/user/404");

    // get users
    res.locals.users = await getUsers(req.session.email);
    // get other chats
    res.locals.rooms = await getChats(req.session.email);

  } catch (e) {
    return res.redirect("/user/404");
  }

  return res.render("user/chat");
};

module.exports.createGroup = async (req, res) => {
  res.locals._token = req.session._token;
  res.locals.users = await Users.find({ email: { $ne: req.session.email } });
  res.render("user/create-group");
};

// POST
module.exports.logoutPOST = (req, res) => {
  if (!req.validateToken) return res.redirect("/user/404");
  req.session.destroy();
  return res.redirect("/");
};

module.exports.createGroupPOST = async (req, res) => {
  if (!req.validateToken) return res.redirect('/user/404')
  const users = [req.session.email, ...req.body.users];
  const name = req.body.name;

  if (users.length === 0 || !name) return res.redirect("/user/404");

  const room = new Rooms();

  room.id = uuid4();
  room.isGroup = true;
  room.users = [];
  room.name = name;

  for (const user of users) {
    if (!checkUserExists(user)) return res.redirect('/user/404')
    room.users.push({ email: user });
  }

  try {
    await room.save();
    for (const user of users) {
      const isUpdated = await Users.updateOne(
        { email: user },
        { $push: { rooms: { id: room.id } } }
      );
      if (!isUpdated) throw new Error();
    }
    return res.redirect("/user/chat/" + room.id);
  } catch (e) {
    return res.redirect('/user/404');
  }

};
