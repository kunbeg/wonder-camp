const Campground = require("../models/campground")
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
module.exports.renderIndex = async (req, res) => {
    const campgrounds = await Campground.find({})
    res.render('campgrounds/index', { campgrounds })
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new')
}

module.exports.createCampground = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.camp.location,
        limit: 1
    }).send()
    const newCamp = await new Campground(req.body.camp)
    newCamp.geometry = geoData.body.features[0].geometry;
    newCamp.author = req.user._id
    newCamp.images = req.files.map(f=>({url: f.path, filename: f.filename}))
    await newCamp.save()
    req.flash('success','Succesfully made a campground.')
    res.redirect(`/campgrounds/${newCamp._id}`)
}

module.exports.renderShowPage = async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate({
        path:'reviews',
        populate:{
            path:'author'
        }
    }).populate('author')
    if(!campground){
        req.flash('error','Sorry no such campground exist.')
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground })
}

module.exports.renderEditPage = async (req, res) => {
    const {id} = req.params
    const campground = await Campground.findById(id)
    if(!campground){
        req.flash('error','Sorry no such campground exist.')
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground })
}

module.exports.updateCampground = async (req, res) => {
    const {id} =req.params
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.camp });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);
    await campground.save();
    if(req.body.deleteImages){
        for(let filename of req.body.deleteImages)
        await cloudinary.uploader.destroy(filename)

        await campground.updateOne({$pull: {images:{filename:{$in: req.body.deleteImages}}}})
    }
    req.flash('success','Succesfully updated the campground.')
    res.redirect(`/campgrounds/${id}`)
}

module.exports.deleteCampground = async (req, res) => {

    await Campground.findByIdAndDelete(req.params.id)
    req.flash('success','Succesfully deleted  campground.')
    res.redirect('/campgrounds')
}
