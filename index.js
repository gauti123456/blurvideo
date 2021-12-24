const {exec} = require("child_process");
const path = require("path");
const express = require("express");
const bodyparser = require("body-parser");
const multer = require("multer");
const fs = require("fs");

const app = express();

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const videoFilter = function (req, file, callback) {
  var ext = path.extname(file.originalname);
  if (
    ext !== ".mp4" &&
    ext !== ".avi" &&
    ext !== ".flv" &&
    ext !== ".wmv" &&
    ext !== ".mov" &&
    ext !== ".mkv" &&
    ext !== ".gif" &&
    ext !== ".m4v"
  ) {
    return callback("This Extension is not supported");
  }
  callback(null, true);
};

var maxSize = 10000 * 1024 * 1024;

var uploadvideo = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: videoFilter,
}).single("file");

app.use(express.static(path.resolve(__dirname + "public/uploads")));
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.render("index");
});

app.post("/uploadvideo", (req, res) => {
  uploadvideo(req, res, function (err) {
    if (err) {
      return res.end("Error uploading file." + err);
    }
    res.json({
      path: req.file.path,
    });
  });
});

app.post("/blurvideo", (req, res) => {
  console.log(req.body);

  output = Date.now() + "output" + path.extname(req.body.path);

  console.log(output);

  exec(
    `ffmpeg -i ${req.body.path} -preset ultrafast -filter_complex "[0:v]crop=${req.body.width}:${req.body.height}:${req.body.width}:${req.body.height},boxblur=${req.body.power}[fg];[0:v][fg]overlay=${req.body.x}:${req.body.y}[v]" -map "[v]" ${output}`,
    (err, stdout, stderr) => {
      if (err) {
        console.log(err);
        res.json({
          error: "some error takes place",
        });
      }
      res.json({
        path: output,
      });
    }
  );
});


app.get("/download", (req, res) => {
  var pathoutput = req.query.path;
  console.log(pathoutput);
  var fullpath = path.join(__dirname, pathoutput);
  res.download(fullpath, (err) => {
    if (err) {
      fs.unlinkSync(fullpath);
      res.send(err);
    }
    fs.unlinkSync(fullpath);
  });
});

app.listen(3000, () => {
  console.log("App is listening on port 3000");
});
