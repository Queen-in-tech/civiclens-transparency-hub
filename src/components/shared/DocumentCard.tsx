import { Link } from "react-router-dom";
import { FileText, Download, Calendar, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Document {
  id: string;
  Title: string;
  createdTime: string;
   "Date Published": string;
  fileSize: string;
  year: number;
  Source?: string;
  Type: string;
  "Document URL": string;
}

interface DocumentCardProps {
  document: Document;
}

const DocumentCard = ({ document }: DocumentCardProps) => {
  return (
    <div className="group bg-card rounded-xl border border-border p-5 card-hover">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          <FileText className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <Link
            to={`/documents/${document.id}`}
            className="font-display font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 mb-2"
          >
            {document.Title}
          </Link>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {document["Date Published"]}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              {document.fileSize}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          {document.Type} - {document.Source}
        </span>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          <Download className="h-4 w-4 mr-1" />
           <a
                  href={document["Document URL"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center"
                > 
          Download
          </a>
        </Button>
      </div>
    </div>
  );
};

export default DocumentCard;
