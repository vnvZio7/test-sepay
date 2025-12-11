const express = require("express");
const passport = require("passport");
const session = require("express-session");
require("dotenv").config();
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();

// TODO: Thay bằng thông tin thật của bạn
const GOOGLE_CLIENT_ID = process.env.GOOGLE_AUTH_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_AUTH_CLIENT_SECRET;

// Passport config
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // Trong thực tế: lưu profile vào DB
      console.log(profile);
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Middleware
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get("/", (req, res) => {
  res.send(`<h1>Home</h1><a href="/auth/google">Login with Google</a>`);
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account", // 👈 ép hiện màn hình chọn tài khoản
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // Successful login
    res.redirect("/profile");
  }
);

app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.send(`
        <h1>Profile</h1>
        <p>Name: ${req.user.displayName}</p>
        <p>Image: <img src="${req.user.photos[0].value}"/></p>
        <p>Email: ${req.user.emails[0].value}</p>
        <a href="/logout">Logout</a>
    `);
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      // Sau khi logout, chuyển về trang chính
      res.redirect("/");
    });
  });
});

// Start server
app.listen(3001, () => {
  console.log("Server started on http://localhost:3001");
});
