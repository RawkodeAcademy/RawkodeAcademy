import * as migration_20261004_153744 from './20261004_153744';
import * as migration_20261004_154006 from './20261004_154006';
import * as migration_20261004_154154 from './20261004_154154';
import * as migration_20261004_154336 from './20261004_154336';
import * as migration_20261004_161607_oidc from './20261004_161607_oidc';
import * as migration_20261004_201756 from './20261004_201756';
import * as migration_20261004_202555 from './20261004_202555';
import * as migration_20261004_204039 from './20261004_204039';
import * as migration_20261004_204407 from './20261004_204407';
import * as migration_20261004_210158 from './20261004_210158';
import * as migration_20261005_120000_video_review from './20261005_120000_video_review';
import * as migration_20261005_180000_review_intake from './20261005_180000_review_intake';
import * as migration_20261005_200000_review_jobs from './20261005_200000_review_jobs';
import * as migration_20261007_140000_review_thumbnails from './20261007_140000_review_thumbnails';
import * as migration_20261009_130000_review_revision_grants from './20261009_130000_review_revision_grants';
import * as migration_20261017_231617_youtube_sync from './20261017_231617_youtube_sync';

export const migrations = [
  {
    up: migration_20261004_153744.up,
    down: migration_20261004_153744.down,
    name: '20261004_153744',
  },
  {
    up: migration_20261004_154006.up,
    down: migration_20261004_154006.down,
    name: '20261004_154006',
  },
  {
    up: migration_20261004_154154.up,
    down: migration_20261004_154154.down,
    name: '20261004_154154',
  },
  {
    up: migration_20261004_154336.up,
    down: migration_20261004_154336.down,
    name: '20261004_154336',
  },
  {
    up: migration_20261004_161607_oidc.up,
    down: migration_20261004_161607_oidc.down,
    name: '20261004_161607_oidc',
  },
  {
    up: migration_20261004_201756.up,
    down: migration_20261004_201756.down,
    name: '20261004_201756',
  },
  {
    up: migration_20261004_202555.up,
    down: migration_20261004_202555.down,
    name: '20261004_202555',
  },
  {
    up: migration_20261004_204039.up,
    down: migration_20261004_204039.down,
    name: '20261004_204039',
  },
  {
    up: migration_20261004_204407.up,
    down: migration_20261004_204407.down,
    name: '20261004_204407',
  },
  {
    up: migration_20261004_210158.up,
    down: migration_20261004_210158.down,
    name: '20261004_210158',
  },
  {
    up: migration_20261005_120000_video_review.up,
    down: migration_20261005_120000_video_review.down,
    name: '20261005_120000_video_review',
  },
  {
    up: migration_20261005_180000_review_intake.up,
    down: migration_20261005_180000_review_intake.down,
    name: '20261005_180000_review_intake',
  },
  {
    up: migration_20261005_200000_review_jobs.up,
    down: migration_20261005_200000_review_jobs.down,
    name: '20261005_200000_review_jobs',
  },
  {
    up: migration_20261007_140000_review_thumbnails.up,
    down: migration_20261007_140000_review_thumbnails.down,
    name: '20261007_140000_review_thumbnails',
  },
  {
    up: migration_20261009_130000_review_revision_grants.up,
    down: migration_20261009_130000_review_revision_grants.down,
    name: '20261009_130000_review_revision_grants',
  },
  {
    up: migration_20261017_231617_youtube_sync.up,
    down: migration_20261017_231617_youtube_sync.down,
    name: '20261017_231617_youtube_sync'
  },
];
