const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../../../models/login/userschema'); // Adjust path as needed

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:8000/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email : profile.emails[0].value });
      if (user) {
        done(null, user);
      } else {
        user = await new User({
          googleId: profile.id,
          email : profile.emails[0].value,
          firstname: profile.displayName,
          is_block : false
        }).save();
        done(null, user);
      }
    } catch (error) {
      console.error(error);
      done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

googleSuccess = async (req, res, next) => {
  try {
      if (!req.user) {
          return res.redirect('/login');
      }
      if (req.user.is_blocked) {
          return res.render('login',{ message : 'User blocked'});
      }
      req.session.user_id = req.user._id;
      res.redirect('/');
  } catch (error) {
      res.send(error);
  }
};

module.exports = {
  googleSuccess
};
