const ApiError = require("../error/ApiError");
const { User, Role } = require("../models/models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op, json } = require("sequelize");
const nodemailer = require("nodemailer");
const generatePassword = require("omgopass");
const generateJwt = function (
  id,
  name,
  email,
  roleId,
  registrationDate,
  first_entry,
  phone,
  birthday
) {
  return jwt.sign(
    { id, name, email, roleId, registrationDate, first_entry, phone, birthday },
    process.env.SECRET_KEY,
    { expiresIn: "24h" }
  );
};

class UserController {
  async registration(req, res, next) {
    const { name, email, roleId, phone, birthday } = req.body;
    const date = new Date();
    const password = generatePassword();

    if (!email) {
      return next(ApiError.badRequest("Некорректный email или пароли"));
    }

    try {
      const candidate = await User.findOne({ where: { email } });

      if (candidate) {
        return next(
          ApiError.badRequest("Пользователь с таким email уже существует")
        );
      }

      const hashPassword = await bcrypt.hash(password, 5);
      const user = await User.create({
        name,
        email,
        roleId,
        password: hashPassword,
        registrationDate: date.toLocaleString(),
        phone,
        birthday,
      });

      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.USER_PASSWORD,
        },
      });

      const mailOptions = {
        from: {
          name: "MegaLife",
          address: process.env.USER_EMAIL,
        },
        to: [email],
        subject: "Password",
        html: password,
      };

      const sendEmail = await transporter.sendMail(mailOptions);

      const token = generateJwt(
        user.id,
        user.name,
        user.email,
        user.role,
        user.registrationDate
      );

      return res.json({ token });
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async login(req, res, next) {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return next(ApiError.badRequest("Пользователь с таким emal не найден"));
      }
      let comparePassword = bcrypt.compareSync(password, user.password);
      if (!comparePassword) {
        return next(ApiError.badRequest("Не верный пароль"));
      }
      const first_entry = user.first_entry;
      const userId = user.id;
      const token = generateJwt(
        user.id,
        user.name,
        user.email,
        user.roleId,
        user.registrationDate,
        user.first_entry,
        user.phone,
        user.birthday
      );
      return res.json({
        userId,
        first_entry,
        token,
      });
    } catch (error) {
      return next(ApiError.badRequest(error.message));
    }
  }

  async check(req, res, next) {
    const token = generateJwt(
      req.user.id,
      req.user.name,
      req.user.email,
      req.user.roleId,
      req.user.first_entry,
      req.user.registrationDate,
      req.user.phone,
      req.user.birthday
    );
    return res.json({ token });
  }

  async getAllAdmin(req, res, next) {
    const { roleId } = req.query;
    try {
      let users;

      if (!roleId) {
        users = await User.findAll({
          include: [
            {
              model: Role,
              attributes: ["name"],
            },
          ],
        });
        users.forEach((user) => {
          user.roleId;
        });
      }

      if (roleId) {
        users = await User.findAll({ where: { roleId } });
      }
      return res.json(users);
    } catch (error) {
      return next(ApiError.badRequest(error.message));
    }
  }

  async getAllTeacher(req, res, next) {
    const { roleId } = req.query;
    let users;

    try {
      if (roleId === "1") {
        return next(ApiError.badRequest("У вас нет доступа"));
      }

      if (!roleId) {
        users = await User.findAll({
          where: {
            roleId: {
              [Op.not]: 1,
            },
          },
        });
      }

      if (roleId) {
        users = await User.findAll({ where: { roleId } });
      }
      return res.json(users);
    } catch (error) {
      return next(ApiError.badRequest(error.message));
    }
  }

  async getUserId(req, res, next) {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return next(ApiError.badRequest("пользователь не найден"));
    }
    res.json(user);
  }

  async deleteUserId(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).send("User not found");
      }
      await user.destroy();
      res.send("User deleted");
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  }

  async firstEntry(req, res, next) {
    try {
      const { password } = req.body;
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return next(ApiError.badRequest("Пользователь не найден"));
      }
      const hashPassword = await bcrypt.hash(password, 5);
      user.password = hashPassword;
      user.first_entry = false;
      await user.save();
      res.json(user);
    } catch (error) {
      return next(ApiError.badRequest(error.message));
    }
  }

  async sendEmail(req, res, next) {
    const { email } = req.body;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smpt.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
    });
    const mailOptions = {
      from: {
        name: "Web Wizard",
        address: process.env.USER_EMAIL,
      }, // sender address
      to: ["Pav.Barashkov@yandex.ru"], // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>", // html body
    };
    try {
      const sendEmail = await transporter.sendMail(mailOptions);
      return res.json(sendEmail);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async newPassword(req, res, next) {
    const { email } = req.body;
    const password = generatePassword();

    try {
      const user = await User.findOne({where: {email: email}});
      if (!user) {
        return next(ApiError.badRequest("Пользователь не найден"));
      }
      user.new_password = password;
      user.first_entry = true;
      await user.save();
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.USER_PASSWORD,
        },
      });

      const mailOptions = {
        from: {
          name: "MegaLife",
          address: process.env.USER_EMAIL,
        },
        to: [email],
        subject: "New password",
        html: `<h1>Здравствуйте</h1><p>Ваш новый пароль: ${password}</p> <p>Перейдите по ссылке для восстановления пароля</p><p>${process.env.LINK_TO_RESET_PAGE}<p/>`,
      };

      await transporter.sendMail(mailOptions);

      return res.json({ message: "готово" });
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async resetPassword(req, res, next) {
    const { email, password } = req.body
    
    try {
      const user = await User.findOne({where: {email: email}})
      if (!user) {
        return next(ApiError.badRequest("Пользователь не найден"));
      }
      if (user.new_password !== password) {
        return next(ApiError.badRequest("Неверный пароль"));
      }
      const hashPassword = await bcrypt.hash(password, 5);
      user.password = hashPassword
      await user.save();
      return res.json(user)
    } catch (e) {
      next(ApiError.badRequest(e.message))
    }
  }
}

module.exports = new UserController();
