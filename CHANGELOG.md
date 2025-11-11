# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of ChronoStash
- Multi-database support (PostgreSQL, MySQL, MongoDB)
- S3-compatible storage backends (AWS S3, MinIO, Cloudflare R2)
- Automated backup scheduling with cron expressions
- Retention policies (age-based and count-based)
- Real-time backup progress monitoring
- Slack and Telegram notifications
- RESTful API for automation
- Web UI with React
- Job queue with BullMQ
- Import/export settings
- Backup encryption with AES-256-GCM
- Docker Compose deployment

## [1.0.0] - TBD

Initial release.

### Added
- Core backup and restore functionality
- Schedule management
- Storage target configuration
- Database connection management
- User authentication and settings
- Comprehensive dashboard with analytics
- Notification system
- API documentation
- Docker support

---

**Legend:**
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities
