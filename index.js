require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize =  require('./bd');
const models = require('./models/models');
const {Role, User} = require('./models/models');
const router = require('./routes/index');
const errorHandler = require('./milddleware/ErrorHandlingMiddleware');
const bcrypt = require('bcrypt');


const PORT = process.env.PORT || 5000;
const app = express();


app.use(cors());
app.use(express.json());
app.use('/api', router);

app.use(errorHandler);
const start = async() => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        await Role.findOrCreate({
            where: { name: process.env.ROLE_ADMIN },
            defaults: { name: process.env.ROLE_ADMIN },
        });
        const hashPassword = await bcrypt.hash(process.env.ADMIN_PASSORD, 5);
        await User.findOrCreate({
            where: { email: process.env.ADMIN_EMAIL },
            defaults: {
                name: process.env.ADMIN_NAME,
                email: process.env.ADMIN_EMAIL,
                password: hashPassword,
                registrationDate: new Date().toLocaleString(),
                roleId: process.env.ADMIN_ROLE,
            },
        });
        app.listen(PORT, () => console.log('server working' + PORT));
    } catch (e) {
        console.log(e)
    }
}

start()