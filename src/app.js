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

/**
 * Get all unpaid jobs for the user, for active contracts only.
 */
app.get('/jobs/unpaid', getProfile, async (req, res) => {
    const { Job, Contract } = req.app.get('models')

    const profileId = req.profile.id
    // SELECT job.* FROM jobs job 
    // LEFT JOIN contracts c ON job.contract_id = c.id
    // WHERE c.status = 'in_progress' AND j.paid = false
    // AND (c.ContractorId = UID OR c.ClientId = UID)
    const results = await Job.findAll({
        where: {
            [Op.and]: [
                {
                    '$Contract.status$': 'in_progress',
                    paid: false,
                    [Op.or]: [
                        { '$Contract.ContractorId$': profileId },
                        { '$Contract.ClientId$': profileId },
                    ]
                }
            ]
        },
        include: [{
            model: Contract,
            as: 'Contract'
        }]
    });

    res.json(results)
});


/**
 * POST /jobs/:job_id/pay - Pay for a job,
 *  a client can only pay if his balance >= the amount to pay. 
 * The amount should be moved from the client's balance to the contractor balance.
 */
app.post('/jobs/:jobId/pay', getProfile, async (req, res) => {
    const profileId = req.profile.id
    const {jobId} = req.params;
    const { Job, Contract, Profile } = req.app.get('models')

    // only client can pay
    const job = await Job.findOne({
        where: {
            [Op.and]: [
                {
                    id: jobId,
                    '$Contract.ClientId$': profileId,
                }
            ]
        },
        include: [{
            model: Contract,
            as: 'Contract'
        }]
    });
    if (!job) {
        throw new Error('The job is not found or you do not have enough privileges to access it.');
    }
    if (job.paid) {
        throw new Error('The job is already paid.');
    }
    const profile = await Profile.findOne({ where: { id: profileId } });
    if (profile.balance < job.price) {
        throw new Error('No sufficient funds in balance.');
    }

    const contractorId = job.Contract.ContractorId;

    try {
        await sequelize.transaction(async (transaction) => {
            await Profile.update({ balance: profile.balance - job.price }, {
                where: {
                    id: profileId,
                    updatedAt: profile.updatedAt,
                },
                transaction,
            });

            const contractor = await Profile.findOne({ where: { id: contractorId }, transaction });
            await Profile.update({ balance: contractor.balance + job.price }, {
                where: {
                    id: contractorId,
                    updatedAt: contractor.updatedAt,
                },
                transaction,
            });

            await Job.update({ paid: true, paymentDate: new Date() }, { where: { id: jobId }, transaction });
        });
        res.send({ success: true });
    } catch (error) {
        console.error(`Failed to process the payment. User: ${profileId} Job: ${job.id}`, error);
        throw new Error('Failed to process the payment, please try again later');
    }
});

/**
 * POST /balances/deposit/:userId - Deposits money into the the
 *  balance of a client, 
 * a client can't deposit more than 25% his total of jobs to pay. (at the deposit moment)
 */
app.post('/balances/deposit/:userId', getProfile, async(req,res)=>{
    const profileId = req.profile.id;
    const {userId} = req.params;
    if (parseInt(profileId) !== parseInt(userId)) {
        // If client can deposit only to his/her account, I think there is No need for the :userId parameter.
        // Maybe this endpoint will be used by another party/user. Then relevant authorization should be done.
        throw new Error('Target balance is not found.');
    }

    const { amount } = req.body;

    // TODO: implement proper deposit amount validation
    if (!isFinite(amount) || amount <= 0) {
        throw new Error('Invalid request. "amount" is undefined or invalid.');
    }

    const { Job, Contract, Profile } = req.app.get('models')
    const totalAmountToPay = await Job.sum('price', {
        where: {
            '$Contract.ClientId$': profileId,
            paid: false,
        },
        include: [{
            model: Contract,
            as: 'Contract'
        }]
    });

    if (amount > (totalAmountToPay * 0.25)) {
        console.log(`A client can't deposit more than 25% his total of jobs to pay. User: ${profileId} AmountToPay: ${totalAmountToPay} Deposit: ${amount}`);
        // TODO: provide better, User-friendly error message here.
        throw new Error("A client can't deposit more than 25% his total of jobs to pay.");
    }

    try {
        await sequelize.transaction(async (transaction) => {
            const profile = await Profile.findOne({ where: { id: profileId }, transaction });
            await Profile.update({ balance: profile.balance + amount }, {
                where: {
                    id: profileId,
                    updatedAt: profile.updatedAt,
                },
                transaction,
            });
        });
        console.log(`Deposited ${amount} to the balance of the user ${profileId}`);
        res.send({ success: true });
    } catch (error) {
        console.error(`Failed to process the deposit. User: ${profileId} Amount: ${amount}`, error);
        throw new Error('Failed to process the deposit, please try again later');
    }
    res.send({ success: true });
});

module.exports = app;
