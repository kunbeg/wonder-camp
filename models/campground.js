const mongoose = require('mongoose')
const Review = require('./reviews')
const Schema = mongoose.Schema
const User = require('./user')

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const CampgroundSchema = new Schema({
    title: String,
    price: Number,
    images: [ImageSchema],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
})
CampgroundSchema.post('findOneAndDelete', async function (camp) {
    if (camp.reviews.length) {
        await Review.deleteMany({ _id: { $in: camp.reviews } })
    }
})
module.exports = new mongoose.model('Campground',CampgroundSchema)