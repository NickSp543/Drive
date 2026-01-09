#include "AddCommand.h"
#include <iostream>

using namespace std;

bool AddCommand::execute(const InputChecker& ic, string& response) {
    Compressor::add(ic.filename, ic.data);
    response = "201 Created\n";
    return true;
}