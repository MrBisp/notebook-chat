import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
    title: String,
    content: { type: String, required: true, default: "" },
    subPages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Page', default: [] }], // Reference to sub-pages
    lastEdited: { type: Date, default: Date.now },

});

const workBookSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    pages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Page', default: [] }],
    lastEdited: { type: Date, default: Date.now },
});


const Page = mongoose.models.Page || mongoose.model('Page', pageSchema);
const Workbook = mongoose.models.Workbook || mongoose.model('Workbook', workBookSchema);

export { Page, Workbook };