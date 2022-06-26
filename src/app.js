const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
const {getProfile} = require('./middleware/getProfile')
const {Op} = require('sequelize');

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

/**
 * Fetches the contract if it belongs to the user.
 * @returns contract by id
 */
app.get('/contracts/:id',getProfile ,async (req, res) =>{
    const {Contract} = req.app.get('models')
    const {id} = req.params
    const contract = await Contract.findOne({where: {
        [Op.and]: [
            {
                id,
                [Op.or]: [
                    { ContractorId: req.profile.id },
                    { ClientId: req.profile.id },
                ]
            }
        ]
    }})
    if(!contract) return res.status(404).end()
    res.json(contract)
})

/**
 * Returns a list of non-terminated contracts belonging
 * to the user.
 */
app.get('/contracts', getProfile, async (req, res) => {
    const { Contract } = req.app.get('models')
    const profileId = req.profile.id

    const contracts = await Contract.findAll({
        where: {
            [Op.and]: [
                {
                    status: { [Op.ne]: 'terminated' },
                    [Op.or]: [
                        { ContractorId: profileId },
                        { ClientId: profileId },
                    ]
                }
            ]
        }
    });
    res.json(contracts)
});

module.exports = app;
