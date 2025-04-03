import {config} from './config/env.js';
import app from './app.js';

const PORT = config.port;

app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${PORT}`);
})