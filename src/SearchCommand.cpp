#include "SearchCommand.h"
#include <iostream>

using namespace std;

bool SearchCommand::execute(const InputChecker& ic, string& response) {
    auto names = Compressor::search(ic.data);
    
    if(names.empty()) { // no matches found
        response = "404 Not Found\n";
        return false;
    }

    response = "200 Ok\n\n";
    for (const auto& name : names) { // consolidate names into a single string
        response = response + name + "\n";
    }
    return true;
}