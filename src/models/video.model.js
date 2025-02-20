import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {type: String, required: true},
        thumbNail: {type: String, required: true},
        title: {type: String, required: true, index: true, trim: true},
        description: {type: String, required: true},
        duration: {type: Number, required: true},
        views: { type: Number, default: 0},
        isPublished: {type: boolean, default: false},
        owner: {type: Schema.Types.ObjectId, ref:"User", required: true},
    },
    {timestamps: true}
)

videoSchema.plugin(mongooseAggregatePaginate);

export const Video =  mongoose.model("Video", videoSchema);