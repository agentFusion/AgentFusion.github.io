
// // eslint-disable-next-line no-undef
// console.log(sampleRate); //44100

// import { Message, log,Resampler } from "./common"
const LOG_PREFIX = "[VAD]"
/* export enum Message {
  AudioFrame = "AUDIO_FRAME",
  SpeechStart = "SPEECH_START",
  VADMisfire = "VAD_MISFIRE",
  SpeechEnd = "SPEECH_END",
  SpeechStop = "SPEECH_STOP",
}
 */
export const Message = {
  AudioFrame: "AUDIO_FRAME",
  SpeechStart: "SPEECH_START",
  VADMisfire: "VAD_MISFIRE",
  SpeechEnd: "SPEECH_END",
  SpeechStop: "SPEECH_STOP",
}

function getLog(level) {
  return (...args/* : any */) => {
    console[level](LOG_PREFIX, ...args)
  }
}
const levels = ["error", "debug", "warn"]
const log = levels.reduce((acc, level) => {
  acc[level] = getLog(level)
  return acc
}, {})


export class Resampler {
  inputBuffer/* : Array<number> */
  options = {}
  constructor(/* public */ options) {
    this.options = options
    if (options.nativeSampleRate < 16000) {
      log.error(
        "nativeSampleRate is too low. Should have 16000 = targetSampleRate <= nativeSampleRate"
      )
    }
    this.inputBuffer = []
  }

  process = (audioFrame/* : Float32Array */)/* : Float32Array[] */ => {
    const outputFrames/* : Array<Float32Array> */ = []

    for (const sample of audioFrame) {
      this.inputBuffer.push(sample)
    }

    while (
      (this.inputBuffer.length * this.options.targetSampleRate) /
      this.options.nativeSampleRate >
      this.options.targetFrameSize
    ) {
      const outputFrame = new Float32Array(this.options.targetFrameSize)
      let outputIndex = 0
      let inputIndex = 0
      while (outputIndex < this.options.targetFrameSize) {
        let sum = 0
        let num = 0
        while (
          inputIndex <
          Math.min(
            this.inputBuffer.length,
            ((outputIndex + 1) * this.options.nativeSampleRate) /
            this.options.targetSampleRate
          )
        ) {
          sum += this.inputBuffer[inputIndex] /* as number */
          num++
          inputIndex++
        }
        outputFrame[outputIndex] = sum / num
        outputIndex++
      }
      this.inputBuffer = this.inputBuffer.slice(inputIndex)
      outputFrames.push(outputFrame)
    }
    return outputFrames
  }
}


// interface WorkletOptions {
//   frameSamples: number
// }

class Processor extends AudioWorkletProcessor {
  resampler/* : Resampler */
  _initialized = false
  _stopProcessing = false
  options/* : WorkletOptions */

  constructor(options) {
    super()
    this.options = options.processorOptions /* as WorkletOptions */

    this.port.onmessage = (ev) => {
      if (ev.data.message === Message.SpeechStop) {
        this._stopProcessing = true
      }
    }

    this.init()
  }
  init = async () => {
    log.debug("initializing worklet")
    // console.log('%c log:', 'background: green;', sampleRate)

    this.resampler = new Resampler({
      // nativeSampleRate: sampleRate,
      // eslint-disable-next-line no-undef
      nativeSampleRate: sampleRate, /* 44100 */
      targetSampleRate: 16000,
      targetFrameSize: this.options.frameSamples,
    })
    this._initialized = true
    log.debug("initialized worklet")
  }
  process(
    inputs/* : Float32Array[][] */,
    // outputs/* : Float32Array[][] */,
    // parameters/* : Record<string, Float32Array> */
  )/* : boolean */ {
    if (this._stopProcessing) {
      return false
    }

    const arr = inputs[0][0]

    if (this._initialized && arr instanceof Float32Array) {
      const frames = this.resampler.process(arr)
      for (const frame of frames) {
        this.port.postMessage(
          { message: Message.AudioFrame, data: frame.buffer },
          [frame.buffer]
        )
      }
    }

    return true
  }
}

registerProcessor("vad-helper-worklet", Processor)
