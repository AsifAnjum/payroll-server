const { initializeApp } = require("firebase/app");

const {
  ref,
  getStorage,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} = require("firebase/storage");
const multer = require("multer");
const path = require("path");

const { firebaseConfig } = require("../utils/firebaseConfig");

const { response } = require("../utils/helperFunctions");

// Initialize Firebase

const app = initializeApp(firebaseConfig);
//get firebase storage
const storage = getStorage();

exports.uploader = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const supportedImg = /png|jpg|jpeg|webp/;
    const extension = path.extname(file.originalname);
    if (supportedImg.test(extension)) {
      cb(null, true);
    } else {
      const error = new Error("Only JPG,JPEG,PNG and WEBP files are allowed");
      error.statusCode = 400;
      cb(error);
    }
  },
  limits: {
    files: 1,
    fileSize: 2097152, // max img size 2 mb (2*1024*102)
  },
});

exports.uploadUserImg = async (req, res) => {
  try {
    // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = `${req.params.id}`; //no prefix. auto delete if existing user already has img. only admin can upload
    const storageRef = ref(storage, `user/img/${fileName}`);

    const metadata = {
      contentType: req.file.mimetype,
    };

    //upload img in firebase storage
    const snapshot = await uploadBytesResumable(
      storageRef,
      req.file.buffer,
      metadata
    );

    //get download url
    const getUrl = await getDownloadURL(snapshot.ref);

    return getUrl;
  } catch (error) {
    response(res, 400, "failed", error.message, error);
  }
};
