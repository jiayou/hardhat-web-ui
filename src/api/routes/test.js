const express = require('express');
const router = express.Router();
const ethereum = require('../services/ethereum');


// 测试方法：listAccounts
router.get('/1', async (req, res) => {
    const { httpProvider } = req.app.locals;

    const accounts = await httpProvider.listAccounts();
    console.log(accounts);

    res.json({});
})



router.get('/2', async (req, res) => {
    const { httpProvider } = req.app.locals;
    const result = await ethereum.searchAccounts(httpProvider, 4, 4);
    
    console.log(result);

    console.log(result.data);

    /*

    data:

    [
        [
            {
            from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            to: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
            }
        ]
    ]

    */

    // flatten data:
    const flatData = result.data.flat();

    console.log(flatData);


    /*
    [
        {
            from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            to: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
        },
        {
            from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            to: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
        },
        { from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', to: null },
        { from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', to: null }
    ]

    */

    res.json(flatData);
})



// 只返回交易哈希
router.get('/3', async (req, res) => {
    const { httpProvider } = req.app.locals;
    const result = await ethereum.searchTransactions(httpProvider, 4, 4);
    // console.log(result);
    const flatData = result.data.flat();
    console.log(flatData);
    
    res.json(flatData);
})


// 选择性的返回交易字段
router.get('/4', async (req, res) => {
    console.log(req.query);
    const { httpProvider } = req.app.locals;

    const fields = req.query.fields?.split(',') || [];
    console.log(fields);

    const result = await ethereum.searchTransactions(httpProvider, 4, 4, fields);
    const flatData = result.data.flat();
    res.json(flatData);

})




// 测试 searchAccountTransactions：获取某账户的全部交易
router.get('/5', async (req, res) => {
    const { httpProvider } = req.app.locals;
    const result = await ethereum.searchAccountTransactions(httpProvider, 4, 3, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    console.log(result);
    res.json(result);
})



module.exports = router;
