/**
 * ============================================================================
 * Models Barrel Export
 * ============================================================================
 * Centralizes and exports all database data models:
 * - UserModel: User management and authentication state
 * - PlayerModel: Registered players, stats, and rating boosts
 * - TeamModel: Custom saved teams, squad rosters, and formations
 * - MatchModel: Lineup archiving, score updates, and MVP awards
 * - TournamentModel: League and knockout championship fixtures
 */

const UserModel = require('./user.model');
const PlayerModel = require('./player.model');
const TeamModel = require('./team.model');
const MatchModel = require('./match.model');
const TournamentModel = require('./tournament.model');

module.exports = {
  UserModel,
  PlayerModel,
  TeamModel,
  MatchModel,
  TournamentModel,
};
