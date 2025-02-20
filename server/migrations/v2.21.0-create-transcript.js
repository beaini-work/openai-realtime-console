'use strict'

const migrationVersion = '2.21.0'
const migrationName = `${migrationVersion}-create-transcript`
const loggerPrefix = `[${migrationVersion} migration]`

module.exports = {
  up: async ({ context: { queryInterface } }) => {
    // Use sequelize instance from queryInterface
    const { Sequelize } = queryInterface.sequelize

    await queryInterface.addColumn('podcastEpisodes', 'transcript', {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    })
    await queryInterface.addColumn('podcastEpisodes', 'transcriptionOperation', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true
    })
  },

  down: async ({ context: { queryInterface } }) => {
    await queryInterface.removeColumn('podcastEpisodes', 'transcript')
    await queryInterface.removeColumn('podcastEpisodes', 'transcriptionOperation')
  }
}
