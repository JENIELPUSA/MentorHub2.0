const express = require("express");
const cors = require("cors");

const morgan = require("morgan");
const path = require("path");
const ErrorController = require("./Controller/errorController");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const authentic = require("./Routes/authRouter");
const Announcement = require("./Routes/AnnouncementRoute")
const Qms = require("./Routes/QmsRoute")
const DepartmentRoute = require("./Routes/DepartmentRoute")
const SubjectRoute = require("./Routes/SubjectRoute")
const StudentUserRoute = require("./Routes/UserStudentRoute")
const SectionRoute = require("./Routes/SectionRoute")
const GroupNameRoute = require("./Routes/GroupRoute")
const ProposedTitleRoute = require("./Routes/ProposedRoute")
const StatisticalRoute = require("./Routes/statisticalRoute")
const Notification = require("./Routes/NotificationRoute")
const Comment = require("./Routes/CommentRoute")
const Schedule = require("./Routes/scheduleRoute")

let app = express();

const logger = function (req, res, next) {
  console.log("Middleware Called");
  next();
};

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.set("trust proxy", true);
app.use(
  session({
    secret: process.env.SECRET_STR,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.CONN_STR,
      ttl: 12 * 60 * 60, // 12 hours in seconds
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "none",
      maxAge: 12 * 60 * 60 * 1000,
    },
    rolling: true,
  }),
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  }),
);

app.use(logger);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//importante ito para pag view ng picture sa table .etcc..
const uploadsDir = path.join(__dirname, "..", "uploads");
app.use("/api/v1/announcement", Announcement);
app.use("/api/v1/qms", Qms);
app.use("/api/v1/authentication", authentic);
app.use("/api/v1/Department", DepartmentRoute);
app.use("/api/v1/subjects", SubjectRoute);
app.use("/api/v1/userStudent", StudentUserRoute);
app.use("/api/v1/sections", SectionRoute)
app.use("/api/v1/groups", GroupNameRoute)
app.use("/api/v1/proposed-titles", ProposedTitleRoute)
app.use("/api/v1/statistical", StatisticalRoute)
app.use("/api/v1/notifications", Notification)
app.use("/api/v1/comments", Comment)
app.use("/api/v1/schedule", Schedule)

app.use(ErrorController);

module.exports = app;
