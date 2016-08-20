
#include <string>
#include <iostream>
using namespace std;

#include <nan.h>
#include "gfind.h"
using namespace Nan;
using namespace v8;

class WindowWorker : public AsyncWorker {
  public:
  WindowWorker(Callback *callback, string sequence, int window, int gscore) : AsyncWorker(callback), window(window),sequence(sequence), gscore(gscore){

  }
  void HandleOKCallback () {
    Nan:: HandleScope scope;
    Local<String> s = Nan::New<String>("samples").ToLocalChecked();
    Local<String> s2 = Nan::New<String>("samples2").ToLocalChecked();
    Local<String> s3 = Nan::New<String>("samples3").ToLocalChecked();
    
    Local<Object> obj = Nan::New<Object>();
    Nan::Set(obj, s, Nan::New<Number>(samples));
    Nan::Set(obj, s2, Nan::New<Number>(samples2));
    Nan::Set(obj, s3, Nan::New<Number>(samples3));

    Local<Value> argv[] = { Null(), obj };
    callback->Call(2, argv);
  }

  void Execute () {
    if ( (int) sequence.size() >= window ) {
      for ( int i = 0; i <= sequence.size() - window ; i++  ){
        string win = sequence.substr(i, window);
        vector<G4> g4s = find(win, 2, gscore);
        samples++;
        if (g4s.size() > 0 )samples2++;
        vector<G4>::iterator it; 
        for(it=g4s.begin() ; it < g4s.end(); it++ ) {
          if (it->tetrads > 2 ) {
            samples3++;
            break;
          }
        }
      }
    }
  }
  int window;
  int gscore;
  int samples = 0;
  int samples2 = 0;
  int samples3 = 0;
  string sequence;
};

void Window (const v8::FunctionCallbackInfo<v8::Value>& args) {
  Isolate* isolate = args.GetIsolate();

  int window = 200;
  int gscore = 17;

  if ( args.Length() >= 3 ){
    window = args[2]->NumberValue();
  }
  if ( args.Length() >= 4 ){
    gscore = args[3]->NumberValue();
  }

  v8::String::Utf8Value input(args[0]->ToString());
  string sequence = *input;

  Callback *callback = new Callback(args[1].As<Function>());
  AsyncQueueWorker(new WindowWorker(callback, sequence, window, gscore));
}

void Find(const v8::FunctionCallbackInfo<v8::Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.Length() < 1) {
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments")));
  }
  int gscore = 17;
  int tetrads = 2;
  bool overlaps = true;

  if ( args.Length() >= 2 ){
    tetrads = args[1]->NumberValue();
  }
  if ( args.Length() >= 3 ){
    gscore = args[2]->NumberValue();
  }
  if ( args.Length() >= 4 ){
    overlaps = args[3]->BooleanValue();
  }

  v8::String::Utf8Value input(args[0]->ToString());
  string output = makeJSON(find(*input, tetrads, gscore), overlaps);
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, output.c_str()));
}

void Init(Handle<Object> exports) {
    NODE_SET_METHOD(exports, "find", Find);
    NODE_SET_METHOD(exports, "window", Window);
}

NODE_MODULE(qgrs, Init)