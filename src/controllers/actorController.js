const Actor = require('../models/actor');

class ActorController {
    
  static getTop5ActorsAndInfo(req, res) {
    Actor.getTop5ActorsAndInfo((err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(results);
    });
  }
}

module.exports = ActorController;