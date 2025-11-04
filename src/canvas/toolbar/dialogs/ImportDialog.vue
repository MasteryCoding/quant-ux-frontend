
<template>
     <div class="MatchImportDialog" @dragover="onDragEnter" @dragenter="onDragEnter" @dragleave="onDragLeave" @drop="onDrop">
        <div class="MatcToolbarTabs MatcToolbarTabsBig">
            <a @click="tab='images'" :class="{'MatcToolbarTabActive': tab === 'images'}">{{ getNLS('dialog.import.tab-images')}}</a>
            <a @click="tab='zip'" :class="{'MatcToolbarTabActive': tab === 'zip'}">{{ getNLS('dialog.import.tab-zip')}}</a>
            <a @click="tab='openai'" :class="{'MatcToolbarTabActive': tab === 'openai'}" v-if="hasOpenAI">{{ getNLS('dialog.import.tab-open-ai')}}</a>
 
        </div>
        <div v-if="isPublic">
             <div class="MatchImportDialogCntr">
             {{ getNLS('dialog.import.error-public')}}
            </div>
        </div>
        <div v-else>
            <div v-if="tab=== 'images'">
                <div :class="['MatchImportDialogDropZone MatchImportDialogCntr', {'MatchImportDialogDropZoneHover': hasDrop}]">
                    <span class="MatcHint" v-if="uploadFiles.length === 0">{{ getNLS('dialog.import.images-drop-msg')}}</span>
                    <div class="MatchImportDialogPreview MatcToolbarDropDownButtonItem" v-for="(file,i) in uploadFiles" :key="file.name" :style="{'height': previewHeight, 'width': previewWidth}">
                        <img :src="uploadPreviews[i]" :alt="file.name"/>
                    </div>
                    <input type="file" @change="onFileChange" >
                </div>
            </div>

            <div v-if="tab=== 'zip'">
                <div :class="['MatchImportDialogDropZone MatchImportDialogCntr', {'MatchImportDialogDropZoneHover': hasDrop}]">
                    <span class="MatcHint" v-if="!hasZip">{{ getNLS('dialog.import.zip-drop-msg')}}</span>
                    <span v-else class="MatchImportDialogPreview MatchImportDialogZip MatcToolbarDropDownButtonItem">
                        <span class="mdi mdi-file-code-outline"/>
                    </span>
                    <input type="file" @change="onZipChange" >
                </div>
            </div>

            <div v-if="tab=== 'openai'">
                <div class="MatchImportDialogCntr">
                      <div class="form-group">
                            <label>{{ getNLS('dialog.import.open-ai-prompt')}}</label>
                            <textarea type="text" class="form-control" v-model="openAIPrompt">
                            </textarea>
                        </div>

                        <div class=" MatcButtonBar MatcMarginTop">
                            <a class="MatcButton MatcButtonPrimary"
                                @click.stop="onContinueFigma">{{ getNLS('dialog.import.open-ai-generate')}}
                            </a>
                        </div>
                </div>
            </div>

            <div v-if="tab=== 'progress'">
                <div class="MatchImportDialogCntr">
                    <span class="MatcHint" >
                        {{progressMSG}}
                        <span class="MatcUploadProgressCnr">
                            <span class="MatcUploadProgress" ref="progressBar" :style="'width:' + progessPercent + '%'"/>
                        </span>
                    </span>
                </div>
            </div>
        </div>

        <div class="MatcError">
            {{errorMSG}}
        </div>

        <div class=" MatcButtonBar MatcMarginTop">
            <a class=" MatcButton MatcButtonPrimary" v-if="!isPublic" @click.stop="onSave">{{ getNLS('btn.import')}}</a>
            <a class=" MatcLinkButton" @click.stop="onCancel">{{ getNLS('btn.cancel')}}</a>
        </div>


	</div>
</template>
<style lang="scss">
    @import '../../../style/components/import_dialog.scss';
</style>
<script>
import DojoWidget from 'dojo/DojoWidget'
import Logger from 'common/Logger'
import Util from 'core/Util'
import Services from 'services/Services'
import RadioBoxList from 'common/RadioBoxList'

import ZipSevice from 'services/ZipService'

export default {
    name: 'ImportDialog',
    mixins:[Util, DojoWidget],
    data: function () {
        return {
            tab: "images",
            hasDrop: false,
            hasContinue: false,
            uploadFiles: [],
            uploadPreviews: [],
            hasZip: false,
            zoom: 1,
            errorMSG: '',
            progressMSG: '',
            progessPercent: 0,
            isPublic: false,
            hasOpenAI: false,
            openAIPrompt: ''
        }
    },
    components: {
        'RadioBoxList': RadioBoxList
    },
    computed: {
        previewWidth () {
            return '100px'
        },
        previewHeight () {
            if (this.model) {
                let factor = this.model.screenSize.w  / 100
                return this.model.screenSize.h / factor + 'px'
            }
            return '200px'
        }
    },
    methods: {
        setModel (m){
            this.model = m;
        },

        setPublic (isPublic) {
            this.isPublic = isPublic
        },

        setController (controller) {
            this.controller = controller
        },

        setCanvas(c){
            this.canvas = c
        },

        setJwtToken(t) {
            this.jwtToken = t
        },

        setZoom (z) {
            this.zoom = z
        },

        onCancel () {
            this.$emit('cancel')
        },

        async onSave () {
            this.logger.log(-1, 'onSave', 'enter')
            this.errorMSG = ""
            if (this.tab === 'images') {
                this.tab = 'progress'
                await this.uploadImagesAndCreateScreens()
            }
            if (this.tab === 'zip') {
                await this.importZip()
            }
            if (this.tab === 'openai') {
                await this.importOpenAI()
            }
        },

        async importOpenAI () {
            this.logger.log(-1, 'loadSwagger', 'enter', this.openAIPrompt)
        },

        async uploadImagesAndCreateScreens () {
            this.logger.log(-1, 'uploadImagesAndCreateScreens', 'enter')

            let progress = []
            this.setProgress(10, 'dialog.import.image-progress')

            if (!this.model) {
                this.logger.error('uploadImagesAndCreateScreens', 'no model')
                return
            }

		    let url = '/rest/images/' + this.model.id;
            let imageService = Services.getImageService()
            let promisses = this.uploadFiles.map((file, i) => {
                var formData = new FormData();
				formData.append('file', file);
                return imageService.upload(url, formData, event => {
                    progress[i] = event.loaded / file.size;
                    var total = progress.reduce((a, b) => {
                        return a + b;
                    }, 0);
                    this.setProgress(total * 100)
                })
            })

            let results = await Promise.all(promisses)
            let uploads = results.flatMap(str => {
                let parsed = JSON.parse((str))
	            return parsed.uploads;
            })
            let pos = this.getCanvasCenter()
            let screens = uploads.map((upload,i ) => {

				let x = pos.x + (100 + this.model.screenSize.w) * i;
                let y = pos.y
                let screen = this.createEmptyScreen(x,y, upload.name);
                screen.w = this.model.screenSize.w
                screen.h = this.model.screenSize.h

                screen.style.backgroundImage = {
                    name: upload.name,
                    url : upload.url,
                    w : upload.width,
                    h : upload.height
                };
                return screen
            })
            this.controller.addScreensAndWidgets({screens: screens});

            /**
             * Close dialog
             */
            this.$emit('save')
        },

        getCanvasCenter () {
            if (this.canvas) {
                return {
                    x: Math.max(50, this.getZoomed(-1 * (this.canvas.domPos.x + this.canvas.canvasPos.x - 200), 1 / this.zoom)),
                    y: Math.max(50, this.getZoomed(-1 * (this.canvas.domPos.y + this.canvas.canvasPos.y - 200), 1 / this.zoom)),
                }
            }
            return {x:0, y: 0}
        },

        onDragEnter (e) {
            e.stopPropagation()
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            this.hasDrop = true
        },

        onDragLeave (e) {
            e.stopPropagation()
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            this.hasDrop = false
        },

        onDrop (e) {
            this.logger.log(-1, 'onDrop', 'enter', this.tab)
            e.stopPropagation()
            e.preventDefault()
            let files = e.dataTransfer.files
            this.hasDrop = false
            // flip tab if zip is dropped
            if (files.length === 1 && this.isZipFile(files[0])) {
                this.tab = 'zip'
            }
            if (this.tab === 'zip') {
                this.showZip(files)
            }
            if (this.tab === "images") {
                this.showFiles(files)
            }
        },

        onFileChange (e) {
            let files = e.target.files
            this.hasDrop = false
            this.showFiles(files)
        },

        showFiles (files) {
            this.logger.log(-1, 'showFiles', 'enter', files)
            this.uploadFiles = []
            this.uploadPreviews = []
            for (var i = 0; i < files.length; i++) {
                let file = files[i];
                if (this.isAllowedFileType(file)) {
                    this.uploadFiles.push(file)
                    try {
                        let reader = new FileReader()
                        reader.onload =  () => {
                            this.uploadPreviews.push(reader.result)
                        }
                        reader.readAsDataURL(file)
                    } catch (err) {
                        this.logger.error('showFiles', 'error', err)
                    }
                }
            }
        },

        setProgress (p, msg = '') {
            this.progessPercent = p;
            if (msg) {
                this.progressMSG = this.getNLS(msg)
            }
        },

        isAllowedFileType (file) {
            if(file.size > 50000000){
                this.errorMSG = this.getNLS('dialog.import.error-too-big')
                return false
            }
            let name = file.name.toLowerCase()
            if (name.indexOf('.jpg') > 0 || name.indexOf('.jpeg') > 0 || name.indexOf('.png') > 0 || name.indexOf('.gif') > 0) {
                return true
            } else {
                this.errorMSG = this.getNLS('dialog.import.error-wrong-type')
            }
        },

        /**
         * Zip stuff
         */
        onZipChange (e) {
            let files = e.target.files
            this.showZip(files)
        },

        isZipFile (file) {
            return file.name.endsWith('.zip')
        },

        onZipFileDropped (files) {
            this.tab = 'zip'
            this.showZip(files)
        },

        showZip (files) {
            this.logger.log(-1, 'showZip', 'error', files)
            this.hasZip = true
             this.hasDrop = false
            this.zipFile = files[0]
            this.errorMSG = ""

            if (this.zipFile && !this.isZipFile(this.zipFile)) {
                this.errorMSG = this.getNLS('dialog.import.error-zip-no-file')
                this.hasZip = false
                return
            }
        },

        async importZip () {
            this.logger.log(-1, 'importZip', 'enter')
            if (!this.hasZip) {
                this.errorMSG = this.getNLS('dialog.import.error-no-file')
                return
            }
            if (this.zipFile && !this.isZipFile(this.zipFile)) {
                this.errorMSG = this.getNLS('dialog.import.error-zip-no-file')
                return
            }

            this.tab = 'progress'

            // upload images from zip and update model
            this.setProgress(0.1)
            let zipModel = await ZipSevice.uploadImages(this.zipFile, this.model.id, (done, total) => {
                 this.setProgress(((done / total) * 80) + 20)
            })
            // import app
            await this.controller.importApp(zipModel, this.getCanvasCenter())
            // close dialog
            this.$emit('save')
        }


    },
    mounted () {
        this.logger = new Logger("ImportDialog");
    }
}
</script>