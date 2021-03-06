require("dotenv").config();
require("pretty-error").start();
const { models } = require("../model");
const User = models.user;
const ConnectyCube = require("connectycube");
const CryptoJS = require("crypto-js");
const log = require("log4js").getLogger("conCube-util");
log.level = "info";

// * CryptoJS
const CRYPTO_KEY = process.env.CRYPTO_KEY;

// * Cred ConnectyCube
const CREDENTIALS = {
  appId: process.env.CCUBE_APP_ID,
  authKey: process.env.CCUBE_AUTH_KEY,
  authSecret: process.env.CCUBE_AUTH_SECRET,
};
ConnectyCube.init(CREDENTIALS);

// * ConnectyCube Function
const register = async (user) => {
  try {
    await ConnectyCube.createSession();
    const result = await ConnectyCube.users.signup(user);
    return result;
  } catch (err) {
    log.error(err);
    return { success: false, message: "error" };
  }
};

const createDialog = async (producerObj) => {
  try {
    await ConnectyCube.createSession(producerObj.login);
    const result = ConnectyCube.chat.dialog.create(producerObj.dialog);
    return result;
  } catch (err) {
    log.error(err);
    return { success: false, message: err };
  }
};

const deleteUser = async (producerObj) => {
  try {
    await ConnectyCube.createSession(producerObj.login);
    const result = await ConnectyCube.users.delete(producerObj.conCubeId);
    return result;
  } catch (err) {
    log.error(err);
    return { success: false, message: err };
  }
};

const updateEmail = async (producerObj) => {
  try {
    await ConnectyCube.createSession(producerObj.login);
    const result = await ConnectyCube.users.update({
      login: producerObj.newEmail,
      email: producerObj.newEmail,
    });
    return result;
  } catch (err) {
    log.err(err);
    return { success: false, message: err };
  }
};

const pushNotif = async (producerObj) => {
  try {
    await ConnectyCube.createSession(producerObj.login);

    const pushParameters = {
      notification_type: "push",
      user: { ids: producerObj.notif.user },
      environment: "development",
      message: ConnectyCube.pushnotifications.base64Encode(
        producerObj.notif.payload
      ),
    };

    const result = await ConnectyCube.pushnotifications.events.create(
      pushParameters
    );
    return result;
  } catch (err) {
    log.error(err);
    return { success: false, message: err };
  }
};

// * Local Function
async function conCubeRegister(options) {
  try {
    log.warn("ConnCube register started...", options);
    const { email, password } = options;
    const user = {
      email,
      login: email,
      password,
    };

    const conCubeResponse = await register(user);
    log.info("conCubeResponse", conCubeResponse);
    if (conCubeResponse.success == false) {
      log.error("connectyCube promises not returning value");
      return { success: false, statusCode: 500, message: "error" };
    }

    // * Encrypt
    const encryptPass = CryptoJS.AES.encrypt(password, CRYPTO_KEY).toString();

    return {
      success: true,
      statusCode: 200,
      data: {
        conCubeId: conCubeResponse.user.id,
        conCubePassword: encryptPass,
      },
    };
  } catch (err) {
    log.error(err);
    return {
      success: false,
      statusCode: 500,
      message: "conCube register failed",
    };
  }
}

async function conCubeDeleteUser(options) {
  try {
    log.warn("ConnectyCube delete user started...", options);
    let { conCubeId, conCubePassword, email } = options;

    // * Decrypt conCubePassword
    const encryptPassword = CryptoJS.AES.decrypt(conCubePassword, CRYPTO_KEY);
    const decryptPassword = encryptPassword.toString(CryptoJS.enc.Utf8);
    conCubePassword = decryptPassword;

    const producerObj = {
      conCubeId: parseInt(conCubeId),
      login: { login: email, password: conCubePassword },
    };

    const conCubeResponse = await deleteUser(producerObj);
    log.info("conCubeResponse", conCubeResponse);
    if (conCubeResponse.message == false) {
      log.error("conCube not returning value");
      return { success: false, statusCode: 500, message: "conCube error" };
    }

    return {
      success: true,
      statusCode: 200,
      data: "success",
    };
  } catch (err) {
    log.error(err);
    return {
      success: false,
      statusCode: 500,
      message: "conCube delete user failed",
    };
  }
}

async function conCubeCreateDialog(options) {
  try {
    log.warn("conCube create dialog started...", options);
    let { chemistryId, conCubeId, email, conCubePassword } = options;

    // * Decrypt conCubePassword
    const encryptPassword = CryptoJS.AES.decrypt(conCubePassword, CRYPTO_KEY);
    const decryptPassword = encryptPassword.toString(CryptoJS.enc.Utf8);
    conCubePassword = decryptPassword;

    const producerObj = {
      dialog: { type: 3, occupants_ids: [conCubeId] },
      login: { login: email, password: conCubePassword },
    };

    const conCubeResponse = await createDialog(producerObj);
    log.info("conCubeResponse", conCubeResponse);
    if (conCubeResponse.success == false) {
      log.error("conCube not returning value");
      return { success: false, statusCode: 500, message: "conCube error" };
    }

    // await User_Chemistry.update(
    //   { conCubeDialogId: conCubeResponse._id, conCubeDialogRaw: conCubeResponse },
    //   { where: { id: chemistryId } }
    // );

    return {
      success: true,
      statusCode: 200,
      data: conCubeResponse,
    };
  } catch (err) {
    log.error(err);
    return {
      success: false,
      statusCode: 500,
      message: "conCube create dialog failed",
    };
  }
}

async function conCubeUpdateEmail(options) {
  try {
    log.warn("conCube update email started...", options);
    let { conCubeId, conCubePassword, email, newEmail } = options;

    // * Decrypt conCubePassword
    const encryptPassword = CryptoJS.AES.decrypt(conCubePassword, CRYPTO_KEY);
    const decryptPassword = encryptPassword.toString(CryptoJS.enc.Utf8);
    conCubePassword = decryptPassword;

    const producerObj = {
      conCubeId: parseInt(conCubeId),
      login: { login: email, password: conCubePassword },
      newEmail,
    };
    const conCubeResponse = await updateEmail(producerObj);
    log.info("conCubeResponse", conCubeResponse);
    if (conCubeResponse.success == false) {
      log.error("conCube not returning value");
      return {
        success: false,
        statusCode: 500,
        message: "conCube update email failed",
      };
    }

    return {
      success: true,
      statusCode: 200,
      data: "success",
    };
  } catch (err) {
    log.error(err);
    return {
      success: false,
      statusCode: 500,
      message: "conCube update email failed",
    };
  }
}

async function conCubePushNotif(options) {
  try {
    log.warn("conCube push notif util started...", options);
    let { email, conCubePassword, conCubeIds, targetUserId, title, content } =
      options;

    // * Decrypt conCubePassword
    const encryptPassword = CryptoJS.AES.decrypt(conCubePassword, CRYPTO_KEY);
    const decryptPassword = encryptPassword.toString(CryptoJS.enc.Utf8);
    conCubePassword = decryptPassword;

    // * Prepare Push NOtif Body
    const payload = JSON.stringify({
      title,
      content,
      targetUserId,
    });

    const producerObj = {
      login: { login: email, password: conCubePassword },
      notif: { payload, user: conCubeIds },
    };

    const conCubeResponse = await pushNotif(producerObj);
    log.info("conCubeResponse", conCubeResponse);
    if (conCubeResponse.success == false) {
      log.error(conCubeResponse.message);
      return {
        success: false,
        statusCode: 500,
        message: "conCube not returning value",
      };
    }

    return {
      success: true,
      statusCode: 200,
      data: "success",
    };
  } catch (err) {
    log.error(err);
    return {
      success: false,
      statusCode: 500,
      message: "conCube push notif failed",
    };
  }
}

module.exports = {
  conCubeRegister,
  conCubeDeleteUser,
  conCubeCreateDialog,
  conCubeUpdateEmail,
  conCubePushNotif,
};
