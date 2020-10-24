const Sequelize = require('sequelize');

export class Document extends Sequelize.Model {}

export const createDocumentModel = sequelize => {
    Document.init({
        title: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        authorId: {
            type: Sequelize.INTEGER,
            allowNull: false
        }
    }, {
        sequelize
    });
}
