const chatService = require("../services/chatService");

const startDirectChat = async (req, res, next) => {
  try {
    const data = await chatService.startDirectChat(
      req.userId,
      req.params.hostId
    );

    return res.status(201).json({
      success: true,
      message: "Direct chat started successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const sendUserMessage = async (req, res, next) => {
  try {
    const data = await chatService.sendMessage(
      req.userId,
      "user",
      req.params.chatRoomId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const sendHostMessage = async (req, res, next) => {
  try {
    const data = await chatService.sendMessage(
      req.hostId,
      "host",
      req.params.chatRoomId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getUserChats = async (req, res, next) => {
  try {
    const data = await chatService.getUserChats(req.userId, req.query);

    return res.status(200).json({
      success: true,
      message: "User chats fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getHostChats = async (req, res, next) => {
  try {
    const data = await chatService.getHostChats(req.hostId, req.query);

    return res.status(200).json({
      success: true,
      message: "Host chats fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getUserMessages = async (req, res, next) => {
  try {
    const data = await chatService.getMessages(
      req.userId,
      "user",
      req.params.chatRoomId,
      req.query
    );

    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getHostMessages = async (req, res, next) => {
  try {
    const data = await chatService.getMessages(
      req.hostId,
      "host",
      req.params.chatRoomId,
      req.query
    );

    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const endUserChat = async (req, res, next) => {
  try {
    const data = await chatService.endChat(
      req.userId,
      "user",
      req.params.chatRoomId
    );

    return res.status(200).json({
      success: true,
      message: "Chat ended successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const endHostChat = async (req, res, next) => {
  try {
    const data = await chatService.endChat(
      req.hostId,
      "host",
      req.params.chatRoomId
    );

    return res.status(200).json({
      success: true,
      message: "Chat ended successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startDirectChat,
  sendUserMessage,
  sendHostMessage,
  getUserChats,
  getHostChats,
  getUserMessages,
  getHostMessages,
  endUserChat,
  endHostChat,
};