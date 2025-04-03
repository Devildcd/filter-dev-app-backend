import express from "express";

const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hola Mundo');
});

export default router;