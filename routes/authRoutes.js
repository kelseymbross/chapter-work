//Original passport npm
const passport = require('passport');

module.exports = (app) => {
  //google strategy has an internal specification that associates 'google' with that strategy
  app.get('/auth/google', passport.authenticate('google', {
      //scope dictates what comes back from google
      scope: ['profile', 'email']
    })
  );

  app.get('/auth/google/callback', passport.authenticate('google'));

  app.get('/api/logout', (req, res) => {
    req.logout;
    res.send(req.user);
  });

  app.get('/api/current_user', (req, res) => {
    res.send(req.user);
  });
};
