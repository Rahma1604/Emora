/*
1- هنا بناخد الصورة/التيكيست/الفويس و بنعملهم تحليل بمعنى ان بنحدد الشعور اللي الطفل حاسس به و بنحدد هنخزن الشعور ده هيبقى شكله ايه لما يتخزن في MongoDB.
بنخزن نتيجة كل تحليل بشكل منفصل و بنربط النتيجة بالطفل والتاريخ و نوع التحليل. -2
هنا برضو بنوفر البيانات اللي هنبني عليها ريبورت حالة الطفل. -3

.يعتبر هنا بنهيئ البيانات و الحاجات اللي هنحتاجها عشان نعمل ريبورت حالة الطفل
*/


const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema(
    {
        childId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Child',
            required: true
        },

        caseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Case',
            default: null
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        modality: {
            type: String,
            enum: ['text', 'image', 'voice'],
            required: true
        },

        emotion: {
            type: String,
            enum: [
                'angry',
                'disgust',
                'fear',
                'happy',
                'neutral',
                'sad',
                'surprise',
                'unknown'
            ],
            required: true
        },

        confidence: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        content: {
            type: String,
            default: ''
        },

        fileUrl: {
            type: String,
            default: ''
        },

        contexts: {
            type: [String],
            default: []
        },

        isReliable: {
            type: Boolean,
            default: false
        },

        rawResult: {
            type: mongoose.Schema.Types.Mixed,
            default: () => ({})
        }
    },
    {
        timestamps: true
    }
);

AnalysisSchema.index({
    childId: 1,
    createdAt: -1
});

AnalysisSchema.index({
    childId: 1,
    modality: 1,
    createdAt: -1
});

module.exports = mongoose.model('Analysis', AnalysisSchema);