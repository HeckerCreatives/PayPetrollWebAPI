const Maintenance = require("../models/Maintenance")
const Ingame = require("../models/Ingame")

exports.getingamelist = async (req, res) => {
    const {id, username} = req.user

    const mainte = await Ingame.find()
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem getting maintenance data for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem getting your user details. Please contact customer support." })
    })

    const data = {
        ingamelist: []
    }

    mainte.forEach(valuedata => {
        const {type, value} = valuedata

        data.ingamelist.push(
            {
                type: type,
                value: value
            }
        )
    })

    return res.json({message: "success", data: data})
}

exports.updateingamelist = async (req, res) => {
  try {
    const { type, value } = req.body;

    if (!type || value === undefined) {
      return res.status(400).json({
        message: 'bad-request',
        data: 'Missing required fields: type and value',
      });
    }

    const isValid =
      typeof value === 'number' ||
      (Array.isArray(value) && value.every(v => typeof v === 'string'));

    if (!isValid) {
      return res.status(400).json({
        message: 'bad-request',
        data: 'Value must be a number or an array of strings',
      });
    }

    const updated = await Ingame.findOneAndUpdate(
      { type },
      { value },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: 'not-found',
        data: `Ingame entry of type '${type}' not found.`,
      });
    }

    return res.json({ message: 'success', data: updated });
  } catch (err) {
    console.error(`Error updating ingame list: ${err}`);
    return res.status(500).json({
      message: 'server-error',
      data: 'An unexpected error occurred while updating ingame data.',
    });
  }
};


