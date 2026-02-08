export class LeaderboardController {
  constructor(service) {
    this.service = service;
  }

  getTop = async (req, res, next) => {
    try {
      const entries = await this.service.list(req.query);
      res.status(200).json({ data: entries });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const entry = await this.service.create(req.body);
      res.status(201).json({ data: entry });
    } catch (error) {
      next(error);
    }
  };
}
